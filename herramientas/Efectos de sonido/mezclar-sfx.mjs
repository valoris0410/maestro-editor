// Mezcla efectos de sonido en un video a partir de una lista de eventos {t, sfx, vol?} (la que escribe render-proyecto.mjs en salida/sfx.json).
// Uso: node mezclar-sfx.mjs --video <mp4> --eventos <sfx.json> [--sfx-dir <carpeta> ...] [--salida <mp4>] [--sin-voz] [--lufs -14] [--semilla 5] [--max-por-min 10]
//  - Biblioteca: primero las carpetas de --sfx-dir (sonidos reales, ej. recursos\sfx), después la sintética de esta carpeta.
//    Cada archivo debe EMPEZAR con el nombre de la categoría (tap-*, pop-*, impacto-*...). Si hay varios, se alternan sin repetir seguidos.
//  - Volumen: cada efecto queda a vol × (pico de la voz): vol 0,10 = 20 dB por debajo del pico de la voz.
//  - Con voz: el resultado se normaliza a --lufs (por defecto -14, estándar de Instagram). Con --sin-voz (video sin audio) NO se normaliza,
//    y el pico de referencia de la "voz" se supone en -3 dB.
//  - --ganancia-extra <dB>: sube todos los efectos (solo para escuchar demos sin voz, ej. 14).
//  - Para no pasarse: máximo --max-por-min efectos por minuto (por defecto 10, de mapa-sfx.json); si hay más, se descartan los de menor prioridad.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (k, def) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : def; };
const todos = (k) => args.flatMap((a, i) => (a === k ? [args[i + 1]] : []));
const video = path.resolve(get("--video", ""));
const eventosRuta = path.resolve(get("--eventos", ""));
if (!get("--video") || !get("--eventos")) { console.error("Uso: node mezclar-sfx.mjs --video <mp4> --eventos <sfx.json> [--sfx-dir <carpeta>] [--salida <mp4>] [--sin-voz]"); process.exit(1); }
const salida = path.resolve(get("--salida", video.replace(/\.mp4$/i, "") + "_sfx.mp4"));
const sinVoz = args.includes("--sin-voz");
const lufs = Number(get("--lufs", -14));
const semilla = Number(get("--semilla", 5));
const mapa = JSON.parse(fs.readFileSync(path.join(aqui, "mapa-sfx.json"), "utf8"));
const maxMin = Number(get("--max-por-min", mapa.limite_por_minuto));
const extra = Number(get("--ganancia-extra", 0));   // dB de más (solo para escuchar demos sin voz; con voz real no se usa)
const conSinteticos = args.includes("--con-sinteticos");   // los sintéticos fueron rechazados por la persona (05-11-2026): solo con este flag
const dirs = [...todos("--sfx-dir").map((d) => path.resolve(d)), path.join(aqui, "biblioteca-real", "clips"), ...(conSinteticos ? [path.join(aqui, "biblioteca-sintetica")] : [])];

const run = (cmd, a) => spawnSync(cmd, a, { encoding: "utf8", maxBuffer: 1 << 28 });
const dur = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]).stdout.trim());
const picos = (f, af = "volumedetect") => { const r = run("ffmpeg", ["-hide_banner", "-nostdin", "-i", f, "-af", af, "-vn", "-f", "null", "-"]); const m = /max_volume:\s*(-?[\d.]+) dB/.exec(r.stderr); return m ? Number(m[1]) : null; };

// --- eventos: ordenar, validar y limitar
let ev = JSON.parse(fs.readFileSync(eventosRuta, "utf8")).filter((e) => e && e.sfx && mapa.categorias[e.sfx] && e.t >= 0 && e.t < dur).sort((a, b) => a.t - b.t);
const desconocidos = JSON.parse(fs.readFileSync(eventosRuta, "utf8")).filter((e) => e && e.sfx && !mapa.categorias[e.sfx]).map((e) => e.sfx);
// el mismo sonido a menos de 0,12 s del anterior se descarta
const ult = {}; ev = ev.filter((e) => { const ok = ult[e.sfx] === undefined || e.t - ult[e.sfx] >= 0.12; if (ok) ult[e.sfx] = e.t; return ok; });
const tope = Math.max(6, Math.floor(maxMin * dur / 60));   // el tope por minuto aplica a videos largos; en clips cortos se permiten al menos 6
let descartados = 0;
if (ev.length > tope) {
  const orden = [...ev].sort((a, b) => mapa.categorias[a.sfx].prioridad - mapa.categorias[b.sfx].prioridad || a.t - b.t);
  const sacar = new Set(orden.slice(0, ev.length - tope)); descartados = sacar.size; ev = ev.filter((e) => !sacar.has(e));
}

// --- archivos de cada categoría (reales primero) y alternancia sin repetir seguidos
let s = semilla; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const archivosDe = (cat) => dirs.flatMap((d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.toLowerCase().startsWith(cat) && /\.(wav|mp3|ogg|m4a)$/i.test(f)).map((f) => path.join(d, f)) : []));
const ultimoUsado = {};
const elegir = (cat) => {
  const f = archivosDe(cat); if (!f.length) return null;
  const reales = f.filter((x) => !x.includes("biblioteca-sintetica")), pool = reales.length ? reales : f;
  let c; do { c = pool[Math.floor(R() * pool.length)]; } while (pool.length > 1 && c === ultimoUsado[cat]);
  ultimoUsado[cat] = c; return c;
};
const picoCache = {};
const picoDe = (f) => (picoCache[f] ??= picos(f));

// --- pico de la voz
const tieneAudio = !sinVoz && run("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_type", "-of", "csv=p=0", video]).stdout.trim() !== "";
const picoVoz = tieneAudio ? picos(video) : -3;

const usados = [];
for (const e of ev) {
  const f = elegir(e.sfx); if (!f) { usados.push({ t: e.t, sfx: e.sfx, archivo: null }); continue; }
  const vol = e.vol ?? mapa.categorias[e.sfx].vol;
  const ganancia = (picoVoz + 20 * Math.log10(vol)) - (picoDe(f) ?? -3) + extra;
  usados.push({ t: +e.t.toFixed(3), sfx: e.sfx, archivo: f, vol, ganancia_db: +ganancia.toFixed(1) });
}
const reales = usados.filter((u) => u.archivo);

// --- filtro de ffmpeg
const entradas = ["-i", video];
let base;
if (tieneAudio) base = "[0:a]aresample=48000[v]";
else { entradas.push("-f", "lavfi", "-t", String(dur), "-i", "anullsrc=r=48000:cl=mono"); base = "[1:a]aresample=48000[v]"; }
const off = tieneAudio ? 1 : 2;
const partes = [base];
reales.forEach((u, i) => { entradas.push("-i", u.archivo); const ms = Math.round(u.t * 1000); partes.push(`[${off + i}:a]aresample=48000,aformat=channel_layouts=mono,volume=${u.ganancia_db}dB,adelay=${ms}|${ms}[s${i}]`); });
const ins = ["[v]", ...reales.map((_, i) => `[s${i}]`)].join("");
partes.push(`${ins}amix=inputs=${reales.length + 1}:duration=first:normalize=0:dropout_transition=0[m]`);
partes.push(tieneAudio ? `[m]loudnorm=I=${lufs}:TP=-1.5:LRA=11[out]` : `[m]alimiter=limit=0.95[out]`);
const r = run("ffmpeg", ["-v", "error", "-y", ...entradas, "-filter_complex", partes.join(";"), "-map", "0:v", "-map", "[out]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", String(dur), salida]);
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }

const informe = { video: path.basename(video), salida: path.basename(salida), duracion_s: +dur.toFixed(2), con_voz: tieneAudio, pico_voz_db: picoVoz,
  efectos_usados: reales.length, descartados_por_limite: descartados, categorias_desconocidas: desconocidos, sin_archivo: usados.filter((u) => !u.archivo).map((u) => u.sfx), detalle: usados };
fs.writeFileSync(salida.replace(/\.mp4$/i, "") + ".sfx-informe.json", JSON.stringify(informe, null, 1));
console.log(`Listo: ${salida}\n  ${reales.length} efectos (descartados por límite: ${descartados}), voz: ${tieneAudio ? "sí, normalizado a " + lufs + " LUFS" : "no (video sin audio)"}`);
if (desconocidos.length) console.log("  Categorías desconocidas ignoradas:", [...new Set(desconocidos)].join(", "));
