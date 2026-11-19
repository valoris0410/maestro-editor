// Biblioteca SINTÉTICA de efectos de sonido (respaldo): 12 categorías x 3 variantes, WAV mono 44,1 kHz, pico a -3 dBFS.
// Uso: node generar-sfx.mjs   → biblioteca-sintetica/<categoria>-01.wav ... y prueba-de-oido (ver prueba-de-oido.mjs)
// Los sonidos reales de una biblioteca con licencia (Pixabay, con el OK de la persona) suenan más naturales y tienen prioridad:
// el mezclador los usa primero si están en una carpeta `recursos\sfx` con nombres que empiecen por la categoría (ej. tap-pixabay-01.mp3).
// OJO: no puedo escucharlos; solo verifico duración, pico y silencios. la persona valida de oído.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const SR = 44100, TAU = Math.PI * 2;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "biblioteca-sintetica");
fs.mkdirSync(OUT, { recursive: true });

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const buf = (s) => new Float32Array(Math.max(1, Math.round(s * SR)));
const lp = (x, fc) => { const a = 1 - Math.exp(-TAU * fc / SR); let s = 0; return x.map((v) => (s += a * (v - s))); };
const hp = (x, fc) => { const l = lp(x, fc); return x.map((v, i) => v - l[i]); };
// filtro de estado variable (pasabanda) con frecuencia que cambia en el tiempo
function bp(x, fcFn, q = 1.1) {
  let low = 0, band = 0; const o = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const f = 2 * Math.sin(Math.PI * Math.min(fcFn(i / SR), SR / 6) / SR);
    low += f * band; const high = x[i] - low - band / q; band += f * high; o[i] = band;
  }
  return o;
}
const mix = (a, b, at = 0, g = 1) => { for (let i = 0; i < b.length && i + Math.round(at * SR) < a.length; i++) a[i + Math.round(at * SR)] += b[i] * g; return a; };
const fade = (x, ms = 4) => { const n = Math.round(ms / 1000 * SR); for (let i = 0; i < n && i < x.length; i++) { x[i] *= i / n; x[x.length - 1 - i] *= i / n; } return x; };

const SONIDOS = {
  tap(R) { const x = buf(0.07), f = 1400 + R() * 600; const n = () => R() * 2 - 1;
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = Math.sin(TAU * f * t) * Math.exp(-t * 85) + n() * 0.4 * Math.exp(-t * 420); } return lp(x, 6500); },
  pop(R) { const x = buf(0.13), f1 = 640 + R() * 180; let ph = 0;
    for (let i = 0; i < x.length; i++) { const t = i / SR, f = 260 + (f1 - 260) * Math.min(1, t / 0.045); ph += TAU * f / SR; x[i] = Math.sin(ph) * Math.exp(-t * 34) * (1 - Math.exp(-t * 700)); } return x; },
  click(R) { const x = buf(0.035), n = () => R() * 2 - 1;
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = (n() * 0.8 + Math.sin(TAU * (3000 + R() * 400) * t)) * Math.exp(-t * 320); } return hp(x, 1800); },
  "wosh-suave"(R) { const d = 0.45, x = buf(d).map(() => R() * 2 - 1), o = bp(x, (t) => 600 + 1700 * (t / d) * (0.9 + R() * 0.0), 0.9);
    for (let i = 0; i < o.length; i++) { const t = i / SR; o[i] *= Math.sin(Math.PI * t / d) ** 1.6; } return o; },
  whoosh(R) { const d = 0.52, x = buf(d).map(() => R() * 2 - 1), o = bp(x, (t) => 380 * Math.pow(13, t / d), 1.0);
    for (let i = 0; i < o.length; i++) { const t = i / SR; o[i] *= t < 0.18 ? (t / 0.18) ** 2 : Math.exp(-(t - 0.18) * 7); } return o; },
  "zoom-in"(R) { const d = 0.42, x = buf(d).map(() => R() * 2 - 1), o = bp(x, (t) => 300 * Math.pow(11, t / d), 1.2); let ph = 0;
    for (let i = 0; i < o.length; i++) { const t = i / SR; ph += TAU * (180 + 900 * (t / d) ** 2) / SR; o[i] = (o[i] * 0.9 + Math.sin(ph) * 0.25) * (t / d) ** 1.4; } return fade(o, 12); },
  impacto(R) { const x = buf(0.95), n = () => R() * 2 - 1; let ph = 0;
    for (let i = 0; i < x.length; i++) { const t = i / SR; ph += TAU * (40 + 110 * Math.exp(-t * 11)) / SR; x[i] = Math.sin(ph) * Math.exp(-t * 5.2) + lp([n()], 4000)[0] * 0.0; }
    const crack = lp(buf(0.06).map(() => n()), 4500).map((v, i) => v * Math.exp(-i / SR * 70) * 0.8); mix(x, crack, 0, 1);
    const tail = lp(buf(0.9).map(() => n()), 450).map((v, i) => v * Math.exp(-i / SR * 6) * 0.22); mix(x, tail, 0.01, 1);
    mix(x, x.slice(0, Math.round(0.4 * SR)), 0.045, 0.28); mix(x, x.slice(0, Math.round(0.4 * SR)), 0.1, 0.14); return fade(x, 3); },
  "flash-obturador"(R) { const x = buf(0.24), n = () => R() * 2 - 1;
    const clic = (g) => hp(lp(buf(0.012).map(() => n()), 6000), 2200).map((v, i) => v * Math.exp(-i / SR * 260) * g);
    mix(x, clic(1), 0, 1); mix(x, clic(0.8), 0.075, 1);
    const thunk = buf(0.04).map((_, i) => Math.sin(TAU * 190 * i / SR) * Math.exp(-i / SR * 90) * 0.5); mix(x, thunk, 0.002, 1); mix(x, thunk, 0.077, 0.7); return x; },
  contador(R) { const x = buf(0.95); for (let k = 0; k < 14; k++) { const f = 1700 + k * 45 + R() * 40; mix(x, buf(0.014).map((_, i) => Math.sin(TAU * f * i / SR) * Math.exp(-i / SR * 260)), k * 0.062, 0.9); } return x; },
  riser(R) { const d = 1.0, x = buf(d).map(() => R() * 2 - 1), o = bp(x, (t) => 300 * Math.pow(20, t / d), 1.3); let ph = 0;
    for (let i = 0; i < o.length; i++) { const t = i / SR; ph += TAU * (220 + 660 * (t / d)) / SR; o[i] = (o[i] * 0.8 + Math.sin(ph) * 0.3) * (t / d) ** 2; } return fade(o, 25); },
  shine(R) { const x = buf(0.85), base = 2400 + R() * 500;
    [[1, 1], [1.5, 0.6], [2.02, 0.4]].forEach(([m, g], k) => mix(x, buf(0.8).map((_, i) => Math.sin(TAU * base * m * i / SR) * Math.exp(-i / SR * (6 + k * 2)) * (1 - Math.exp(-i / SR * 900))), k * 0.025, g)); return x; },
  "digital-text"(R) { const x = buf(0.26), fs = [1760, 2093, 2637, 1480, 2349]; for (let k = 0; k < 4; k++) { const f = fs[Math.floor(R() * fs.length)]; mix(x, buf(0.03).map((_, i) => (Math.sin(TAU * f * i / SR) > 0 ? 1 : -1) * Math.exp(-i / SR * 55) * 0.5), [0, 0.05, 0.1, 0.16][k], 1); } return lp(x, 7000); },
};

const meta = [];
for (const [nombre, f] of Object.entries(SONIDOS)) {
  for (let v = 1; v <= 3; v++) {
    const x = f(rng(1000 * v + nombre.length * 7 + v * 13));
    let pico = 0; for (const s of x) pico = Math.max(pico, Math.abs(s));
    const g = 0.708 / (pico || 1);                       // -3 dBFS
    const b = Buffer.alloc(44 + x.length * 2);
    b.write("RIFF", 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12); b.writeUInt32LE(16, 16);
    b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
    b.write("data", 36); b.writeUInt32LE(x.length * 2, 40);
    x.forEach((s, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * g)) * 32767), 44 + i * 2));
    const archivo = `${nombre}-0${v}.wav`;
    fs.writeFileSync(path.join(OUT, archivo), b);
    meta.push({ archivo, duracion_s: +(x.length / SR).toFixed(3) });
  }
}
fs.writeFileSync(path.join(OUT, "indice.json"), JSON.stringify(meta, null, 1));
console.log(`${meta.length} archivos en ${OUT}`);
