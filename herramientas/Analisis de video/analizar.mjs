// Analiza un video de referencia: cortes, curva de movimiento, audio y ráfagas de cuadros de cada evento.
// Uso: node analizar.mjs "<video>" [--transcribir] [--rafagas=12]
// Salida: salida/<nombre>/ con REPORTE.md, datos.json, general.jpg y rafaga-XX.jpg
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync, spawnSync } from "child_process";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const video = path.resolve(args.find((a) => !a.startsWith("--")));
const transcribir = args.includes("--transcribir");
const maxRafagas = Number((args.find((a) => a.startsWith("--rafagas=")) || "=12").split("=")[1]);
const nombre = path.basename(video, path.extname(video)).replace(/[^\w.-]+/g, "_").slice(0, 60);
const out = path.join(here, "salida", nombre);
fs.mkdirSync(out, { recursive: true });

const BUF = { maxBuffer: 1024 * 1024 * 1024 };
const raw = (filtro, extra = []) => execFileSync("ffmpeg", ["-v", "error", "-i", video, ...filtro, ...extra, "-"], BUF);
const round = (n, d = 2) => Number(n.toFixed(d));
const media = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const mediana = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;

// --- Datos básicos
const info = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,r_frame_rate", "-of", "json", video], BUF));
const v = info.streams.find((s) => s.codec_type === "video");
const tieneAudio = info.streams.some((s) => s.codec_type === "audio");
const dur = Number(info.format.duration);
const [fa, fb] = v.r_frame_rate.split("/").map(Number);
const fpsOrigen = fa / fb;

// --- Movimiento: diferencia media entre cuadros consecutivos (0-255) a 30 fps
const FPS = 30, W = 64, H = Math.max(2, Math.round((W * v.height) / v.width / 2) * 2);
const px = raw(["-vf", `fps=${FPS},scale=${W}:${H},format=gray`, "-f", "rawvideo"]);
const n = Math.floor(px.length / (W * H));
const dif = [0];
for (let f = 1; f < n; f++) {
  let s = 0;
  const a = (f - 1) * W * H, b = f * W * H;
  for (let i = 0; i < W * H; i++) s += Math.abs(px[a + i] - px[b + i]);
  dif.push(s / (W * H));
}

// Corte = pico aislado: mucho mayor que el entorno y de un solo cuadro. Movimiento = zona sostenida alta.
const base = mediana(dif);
const cortes = [];
for (let f = 2; f < n - 2; f++) {
  const entorno = Math.max(dif[f - 2], dif[f + 2], 1);
  if (dif[f] > 12 && dif[f] > 3 * entorno && dif[f] >= dif[f - 1] && dif[f] >= dif[f + 1]) cortes.push(round(f / FPS));
}
const porSegundo = [];
for (let s = 0; s < Math.ceil(n / FPS); s++) {
  const tramo = dif.slice(s * FPS, (s + 1) * FPS);
  porSegundo.push(round(media(tramo)));
}
const picos = [];
const umbralMov = Math.max(base * 2.5, 3);
for (let f = 3; f < n - 3; f++) {
  const suave = media(dif.slice(f - 2, f + 3));
  if (suave > umbralMov && dif[f] === Math.max(...dif.slice(f - 6, f + 7))) picos.push({ t: round(f / FPS), fuerza: round(suave) });
}

// --- Audio: energía cada 20 ms y golpes (subidas bruscas)
let golpes = [], lufs = null, picosAudio = [], silencios = [];
if (tieneAudio) {
  const pcm = raw(["-vn", "-ac", "1", "-ar", "8000", "-f", "s16le"]);
  const paso = 160, en = [];
  for (let i = 0; i + paso * 2 <= pcm.length; i += paso * 2) {
    let s = 0;
    for (let j = 0; j < paso; j++) s += pcm.readInt16LE(i + j * 2) ** 2;
    en.push(Math.sqrt(s / paso));
  }
  const prom = media(en) || 1;
  for (let i = 10; i < en.length - 1; i++) {
    const antes = media(en.slice(i - 10, i));
    if (en[i] > prom * 1.3 && en[i] > antes * 1.8 && (!golpes.length || i * 0.02 - golpes[golpes.length - 1] > 0.12)) golpes.push(round(i * 0.02));
  }
  let ini = null;
  en.forEach((e, i) => {
    const bajo = e < prom * 0.08;
    if (bajo && ini === null) ini = i;
    if (!bajo && ini !== null) { if ((i - ini) * 0.02 >= 0.3) silencios.push([round(ini * 0.02), round(i * 0.02)]); ini = null; }
  });
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", video, "-af", "ebur128", "-f", "null", "-"], { encoding: "utf8", ...BUF });
  const m = [...(r.stderr || "").matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop(); // el último es el resumen final
  lufs = m ? Number(m[1]) : null;
}
const cortesEnGolpe = cortes.filter((c) => golpes.some((g) => Math.abs(g - c) <= 0.1)).length;
const planos = cortes.map((c, i) => round(c - (cortes[i - 1] ?? 0)));

// --- Eventos para las ráfagas: primero cortes, luego picos de animación, repartidos en el tiempo
const eventos = [];
const libre = (t) => eventos.every((e) => Math.abs(e.t - t) > 0.7);
const agregar = (t, tipo) => { if (eventos.length < maxRafagas && libre(t)) eventos.push({ t, tipo }); };
agregar(0.05, "inicio");
[...picos].sort((a, b) => b.fuerza - a.fuerza).slice(0, Math.ceil(maxRafagas / 2)).forEach((p) => agregar(p.t, "animacion"));
const pasoCortes = Math.max(1, Math.floor(cortes.length / maxRafagas));
cortes.filter((_, i) => i % pasoCortes === 0).forEach((c) => agregar(c, "corte"));
[...picos].sort((a, b) => b.fuerza - a.fuerza).forEach((p) => agregar(p.t, "animacion"));
if (eventos.length >= maxRafagas) eventos.pop();
agregar(Math.max(0, dur - 1), "cierre");
eventos.sort((a, b) => a.t - b.t);

// --- Hojas de cuadros con el tiempo impreso
const fuente = "C\\:/Windows/Fonts/arialbd.ttf";
const sello = `drawtext=fontfile='${fuente}':text='%{pts\\:hms}':x=6:y=6:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.7:boxborderw=4`;
const hoja = (ss, t, vf, salida) => execFileSync("ffmpeg", ["-v", "error", "-y", "-copyts", "-ss", String(ss), "-t", String(t), "-i", video, "-vf", vf, "-frames:v", "1", path.join(out, salida)], BUF);
const anchoHoja = v.height > v.width ? 240 : 320;
const filas = Math.ceil(Math.min(dur, 48) / 8);
hoja(0, dur, `fps=${Math.min(1, 48 / dur)},scale=${anchoHoja}:-2,${sello},tile=8x${filas}:padding=4`, "general.jpg");
eventos.forEach((e, i) => {
  // 12 cuadros seguidos: 0,1 s antes y 0,5 s después del evento, para ver la curva del movimiento
  const ini = Math.max(0, e.t - 0.1);
  e.hoja = `rafaga-${String(i + 1).padStart(2, "0")}.jpg`;
  hoja(ini, 0.6, `fps=20,scale=${anchoHoja}:-2,${sello},tile=6x2:padding=4`, e.hoja);
});

// --- Transcripción (opcional, local con Parakeet)
let palabras = null;
if (transcribir && tieneAudio) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "analisis-"));
  const copia = path.join(tmp, "video" + path.extname(video));
  fs.copyFileSync(video, copia);
  const r = spawnSync("npx", ["hyperframes@0.8.166", "transcribe", copia, "-e", "parakeet", "-l", "es"], { cwd: tmp, encoding: "utf8", shell: true, ...BUF });
  const f = [path.join(tmp, "transcript.json")].find(fs.existsSync);
  if (f) { fs.copyFileSync(f, path.join(out, "transcript.json")); palabras = JSON.parse(fs.readFileSync(f, "utf8")); }
  else console.error("Sin transcripción:", (r.stderr || r.stdout || "").slice(-400));
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {} // Windows puede retener la carpeta un rato
}

// --- Reporte
const barra = (x) => "█".repeat(Math.min(40, Math.round(x)));
const md = [
  `# Análisis: ${path.basename(video)}`, "",
  `- ${v.width}×${v.height}, ${round(fpsOrigen)} fps, ${round(dur)} s, audio: ${tieneAudio ? `sí (${lufs} LUFS)` : "no"}`,
  `- **Cortes: ${cortes.length}** (${round(cortes.length / (dur / 60), 1)} por minuto). Plano medio ${round(media(planos))} s, mediana ${round(mediana(planos))} s`,
  `- Movimiento base (mediana): ${round(base)} · Golpes de audio: ${golpes.length} · Cortes sobre un golpe (±0,1 s): ${cortesEnGolpe}/${cortes.length}`,
  `- Silencios ≥0,3 s: ${silencios.map(([a, b]) => `${a}-${b}`).join(", ") || "ninguno"}`, "",
  "## Cortes (s)", cortes.join(", ") || "ninguno (o son transiciones suaves / cámara en mano)", "",
  "## Picos de animación (s, fuerza)", picos.map((p) => `${p.t} (${p.fuerza})`).join(", ") || "ninguno", "",
  "## Movimiento por segundo", "```", ...porSegundo.map((x, s) => `${String(s).padStart(3)}s ${String(x).padStart(6)} ${barra(x)}`), "```", "",
  "## Ráfagas (12 cuadros a 20 fps: 0,1 s antes y 0,5 s después)", ...eventos.map((e) => `- ${e.hoja}: ${e.tipo} en ${e.t} s`), "",
  "## Golpes de audio (s)", golpes.join(", ") || "ninguno", "",
];
if (palabras) md.push("## Transcripción", (Array.isArray(palabras) ? palabras : palabras.words || []).map((w) => w.text ?? w.word ?? "").join(" "), "");
fs.writeFileSync(path.join(out, "REPORTE.md"), md.join("\n"));
fs.writeFileSync(path.join(out, "datos.json"), JSON.stringify({ dur, cortes, planos, picos, porSegundo, golpes, silencios, lufs, eventos }, null, 1));
console.log(md.join("\n"));
console.log("Salida:", out);
