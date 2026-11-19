// Arma un solo audio con TODOS los sonidos de la biblioteca sintética (3 variantes por categoría) para que la persona los escuche y apruebe o rechace.
// Uso: node prueba-de-oido.mjs  → prueba-de-oido.m4a (pico a -12 dBFS para cuidar los oídos) y prueba-de-oido.txt (minuto y nombre de cada sonido)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const REAL = process.argv[2] === "real";   // node prueba-de-oido.mjs real → los clips de Pixabay
const dir = REAL ? path.join(aqui, "biblioteca-real", "clips") : path.join(aqui, "biblioteca-sintetica"), SR = 44100;
const archivos = fs.readdirSync(dir).filter((f) => f.endsWith(".wav")).sort();
const cats = [...new Set(archivos.map((f) => f.replace(/-0\d\.wav$/, "")))];
const g = Math.pow(10, -9 / 20);   // de -3 a -12 dBFS
const partes = [], lista = [];
let t = 0;
const silencio = (s) => { partes.push(new Int16Array(Math.round(s * SR))); t += s; };
silencio(0.5);
for (const c of cats) {
  for (const f of archivos.filter((x) => x.startsWith(c + "-0"))) {
    const b = fs.readFileSync(path.join(dir, f)), n = (b.length - 44) / 2, x = new Int16Array(n);
    for (let i = 0; i < n; i++) x[i] = Math.round(b.readInt16LE(44 + i * 2) * g);
    lista.push(`${String(Math.floor(t / 60)).padStart(1, "0")}:${(t % 60).toFixed(1).padStart(4, "0")}  ${f}`);
    partes.push(x); t += n / SR; silencio(0.9);
  }
  silencio(0.8);   // pausa más larga entre categorías
}
const total = partes.reduce((a, p) => a + p.length, 0), out = Buffer.alloc(44 + total * 2);
out.write("RIFF", 0); out.writeUInt32LE(36 + total * 2, 4); out.write("WAVE", 8); out.write("fmt ", 12); out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
out.write("data", 36); out.writeUInt32LE(total * 2, 40);
let o = 44; for (const p of partes) for (const v of p) { out.writeInt16LE(v, o); o += 2; }
const wav = path.join(aqui, "_prueba.wav");
fs.writeFileSync(wav, out);
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-c:a", "aac", "-b:a", "160k", path.join(aqui, (REAL ? "prueba-de-oido-real.m4a" : "prueba-de-oido.m4a"))]);
fs.rmSync(wav);
fs.writeFileSync(path.join(aqui, (REAL ? "prueba-de-oido-real.txt" : "prueba-de-oido.txt")), "Minuto:segundo y sonido (3 variantes por categoría, en este orden)\n\n" + lista.join("\n") + "\n");
console.log(`prueba-de-oido.m4a: ${(total / SR).toFixed(1)} s, ${lista.length} sonidos`);
