// Convierte los archivos descargados de Pixabay (biblioteca-real/*.mp3, algunos de 10 a 90 s) en clips cortos listos para mezclar: biblioteca-real/clips/<categoria>-NN.wav
// Uso: node preparar-biblioteca.mjs
//  - Detecta los silencios y separa cada sonido; si un archivo trae varios (ej. "WHOOSH (multiple)"), cada uno es una variante.
//  - Si es una pista continua (ej. 88 s de máquina de escribir), toma 3 pedazos de 20 %, 50 % y 80 %.
//  - Largo máximo por categoría (mapa-sfx.json: max_s) con fundido de salida; mono, 44,1 kHz, WAV.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const real = path.join(aqui, "biblioteca-real"), clips = path.join(real, "clips");
const mapa = JSON.parse(fs.readFileSync(path.join(aqui, "mapa-sfx.json"), "utf8"));
fs.mkdirSync(clips, { recursive: true });
for (const f of fs.readdirSync(clips)) fs.unlinkSync(path.join(clips, f));   // se regenera entera

const run = (a) => spawnSync("ffmpeg", ["-hide_banner", "-nostdin", ...a], { encoding: "utf8", maxBuffer: 1 << 28 });
const dur = (f) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).stdout.trim());
const MAX_VARIANTES = 6, POR_ARCHIVO = 3;
const contador = {}, informe = [];

for (const archivo of fs.readdirSync(real).filter((f) => f.endsWith(".mp3")).sort()) {
  const cat = archivo.replace(/-\d+-\d+\.mp3$/, "");
  const max = mapa.categorias[cat]?.max_s ?? 2;
  const f = path.join(real, archivo), total = dur(f);
  // --- segmentos con sonido
  const pico = Number(/max_volume:\s*(-?[\d.]+) dB/.exec(run(["-i", f, "-af", "volumedetect", "-f", "null", "-"]).stderr)?.[1] ?? -3);
  const r = run(["-i", f, "-af", `silencedetect=noise=${(pico - 35).toFixed(1)}dB:d=0.12`, "-f", "null", "-"]);
  const ini = [...r.stderr.matchAll(/silence_start:\s*(-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])));
  const fin = [...r.stderr.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  const segs = []; let desde = 0;
  ini.forEach((s, i) => { if (s - desde > 0.03) segs.push([desde, s]); desde = fin[i] ?? total; });
  if (total - desde > 0.03) segs.push([desde, total]);
  let elegidos;
  if (segs.length === 1 && segs[0][1] - segs[0][0] > 5 * max) {            // pista continua: 3 pedazos
    const [a, b] = segs[0]; elegidos = [0.2, 0.5, 0.8].map((p) => [a + (b - a) * p, a + (b - a) * p + max]);
  } else {                                                                  // varios sonidos: los más "enteros", repartidos
    const ok = segs.filter(([a, b]) => b - a >= 0.04);
    const paso = Math.max(1, Math.floor(ok.length / POR_ARCHIVO));
    elegidos = ok.filter((_, i) => i % paso === 0).slice(0, POR_ARCHIVO);
  }
  for (const [a, b] of elegidos) {
    if ((contador[cat] ?? 0) >= MAX_VARIANTES) break;
    const largo = Math.min(b - a + 0.05, max), inicio = Math.max(0, a - 0.01);
    const n = (contador[cat] = (contador[cat] ?? 0) + 1);
    const salida = path.join(clips, `${cat}-${String(n).padStart(2, "0")}.wav`);
    const o = run(["-y", "-ss", String(inicio), "-t", String(largo), "-i", f, "-af", `volume=${(-3 - pico).toFixed(1)}dB,afade=t=in:d=0.002,afade=t=out:st=${Math.max(0, largo - 0.04).toFixed(3)}:d=0.04`, "-ac", "1", "-ar", "44100", "-c:a", "pcm_s16le", salida]);
    informe.push({ clip: path.basename(salida), origen: archivo, desde_s: +inicio.toFixed(2), largo_s: +largo.toFixed(2), ok: o.status === 0 });
  }
}
fs.writeFileSync(path.join(clips, "indice.json"), JSON.stringify(informe, null, 1));
for (const i of informe) console.log(`${i.clip.padEnd(24)} ${String(i.largo_s).padStart(5)} s  ← ${i.origen} @ ${i.desde_s}s${i.ok ? "" : "  ¡FALLÓ!"}`);
console.log(`${informe.length} clips en ${clips}`);
