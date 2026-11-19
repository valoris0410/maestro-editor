// Renderiza los subtítulos de un video con el sistema de capas de la persona y los compone con la persona recortada.
// Uso: node render-subtitulos.mjs --video v.mp4 --plan plan.json --matte carpeta-mascaras --salida carpeta --desde 0 --hasta 25 [--acento "#FFD23F"] [--fps 30] [--matte-desde S]
//   1) dibuja dos capas con transparencia, cuadro por cuadro (detrás de la persona / delante)   2) ffmpeg: video + capa de atrás + persona recortada + capa de adelante
// El texto clave (GOLPE) va DETRÁS de la persona; la voz y la cursiva, delante. Salida: <salida>/subtitulado.mp4 y hoja.jpg
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { pathToFileURL, fileURLToPath } from "url";
import { execFileSync } from "child_process";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > -1 ? process.argv[i + 1] : d; };
const aqui = path.dirname(fileURLToPath(import.meta.url));
const video = path.resolve(arg("video")), planF = path.resolve(arg("plan")), matte = arg("matte") ? path.resolve(arg("matte")) : null;
const salida = path.resolve(arg("salida", "salida-subtitulos")), desde = Number(arg("desde", 0)), hasta = Number(arg("hasta", 25)), FPS = Number(arg("fps", 30));
const acento = arg("acento", "#FFD23F");
const matteDesde = Number(arg("matte-desde", desde));   // segundo en que empiezan las máscaras (matte.py --desde)
const plan = JSON.parse(fs.readFileSync(planF, "utf8"));
const require = createRequire(new URL("../package.json", import.meta.url).href);
const puppeteer = require("puppeteer-core");
for (const d of ["detras", "frente"]) { fs.rmSync(path.join(salida, d), { recursive: true, force: true }); fs.mkdirSync(path.join(salida, d), { recursive: true }); }
// el plan se pasa con tiempos relativos al inicio del tramo
const rel = (c) => c.map((it) => ({ t0: Math.max(0, it.t0 - desde), t1: it.t1 - desde, palabras: it.palabras.map((p) => ({ ...p, t: Math.max(0, p.t - desde) })) })   /* sin tiempos negativos: GSAP corre toda la línea de tiempo */).filter((it) => it.t1 > 0 && it.t0 < hasta - desde);
const P = { voz: rel(plan.voz), golpe: rel(plan.golpe), cursiva: rel(plan.cursiva) };
const browser = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe"), headless: true, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("ERROR en la página:", e.message));
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument((p, a) => { window.PLAN = p; window.ACENTO = a; }, P, acento);
await page.goto(pathToFileURL(path.join(aqui, "subtitulos.html")).href, { waitUntil: "load" });
await page.waitForFunction("!!window.TL", { timeout: 60000, polling: 200 });
await page.evaluate(() => document.fonts.ready.then(() => { }));
const N = Math.round((hasta - desde) * FPS);
const activa = (capas, t) => capas.some((it) => t >= it.t0 - 0.03 && t <= it.t1 + 0.05);
const blanco = path.join(salida, "blanco.png");
await page.evaluate(() => { document.getElementById("detras").style.visibility = "hidden"; document.getElementById("frente").style.visibility = "hidden"; });
await page.screenshot({ path: blanco, omitBackground: true });
for (let f = 0; f < N; f++) {
  const t = f / FPS, nom = String(f).padStart(4, "0") + ".png";
  await page.evaluate((t) => { window.TL.time(t, false); }, t);
  const dentro = { detras: activa(P.golpe, t), frente: activa(P.voz, t) || activa(P.cursiva, t) };
  for (const capa of ["detras", "frente"]) {
    if (!dentro[capa]) { fs.copyFileSync(blanco, path.join(salida, capa, nom)); continue; }
    await page.evaluate((c) => { document.getElementById("detras").style.visibility = c === "detras" ? "visible" : "hidden"; document.getElementById("frente").style.visibility = c === "frente" ? "visible" : "hidden"; }, capa);
    await page.screenshot({ path: path.join(salida, capa, nom), omitBackground: true });
  }
  if (f % 150 === 0) console.log("cuadro", f, "/", N);
}
await browser.close();
// composición: video -> capa de atrás -> persona recortada -> capa de adelante
const out = path.join(salida, "subtitulado.mp4");
const entradas = ["-ss", String(desde), "-t", String(hasta - desde), "-i", video, "-framerate", String(FPS), "-i", path.join(salida, "detras", "%04d.png"), "-framerate", String(FPS), "-i", path.join(salida, "frente", "%04d.png")];
let filtro;
if (matte) { entradas.push("-framerate", String(FPS), "-start_number", String(Math.round((desde - matteDesde) * FPS)), "-i", path.join(matte, "%04d.png"));
  filtro = "[0:v]scale=1080:1920:flags=lanczos,format=rgba,split[b0][b1];[3:v]format=gray[m];[b1][m]alphamerge[pers];[b0][1:v]overlay[x1];[x1][pers]overlay[x2];[x2][2:v]overlay,format=yuv420p[v]";
} else filtro = "[0:v]scale=1080:1920:flags=lanczos,format=rgba[b0];[b0][1:v]overlay[x1];[x1][2:v]overlay,format=yuv420p[v]";
execFileSync("ffmpeg", ["-v", "error", "-y", ...entradas, "-filter_complex", filtro, "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out]);
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", out, "-vf", `fps=12/${hasta - desde},scale=270:-2,tile=6x2:padding=4`, "-frames:v", "1", path.join(salida, "hoja.jpg")]);
console.log("listo:", out);
