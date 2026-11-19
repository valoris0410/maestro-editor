// Renderiza un proyecto HTML (index.html con window.TL = línea de tiempo GSAP pausada) a MP4, cuadro por cuadro a 30 fps.
// Uso: node render-proyecto.mjs "<carpeta del proyecto>" [segundos=3.5]  → <carpeta>/salida/demo.mp4 y hoja.jpg (12 cuadros)
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";
import { pathToFileURL } from "url";
import { execFileSync } from "child_process";

const carpeta = path.resolve(process.argv[2] || ".");
const SEG = Number(process.argv[3] || 3.5), FPS = 30;
const require = createRequire(new URL("../package.json", import.meta.url).href); // ya tiene puppeteer-core
const puppeteer = require("puppeteer-core");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "efecto-"));
fs.mkdirSync(path.join(carpeta, "salida"), { recursive: true });

const browser = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe"), headless: true, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("ERROR en la página:", e.message));
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(carpeta, "index.html")).href, { waitUntil: "load" });
await page.waitForFunction("!!window.TL", { timeout: 60000, polling: 200 });   // devolver un booleano: si devuelve la línea de tiempo, Chrome intenta serializarla y se cuelga
const stage = await page.$("#stage");
for (let f = 0; f < SEG * FPS; f++) {
  await page.evaluate((t) => { window.TL.time(t, false); }, f / FPS);   // sin return: devolver la línea de tiempo cuelga a Chrome
  await stage.screenshot({ path: path.join(tmp, String(f).padStart(4, "0") + ".jpg"), type: "jpeg", quality: 92 });
}
// eventos de sonido que las animaciones anotaron (TIP.eventos) → salida/sfx.json, para Herramientas\Efectos de sonido\mezclar-sfx.mjs
const eventos = await page.evaluate(() => (window.TIP && TIP.eventos) ? TIP.eventos.map((e) => ({ t: e.t, sfx: e.sfx, vol: e.vol })) : []);
fs.writeFileSync(path.join(carpeta, "salida", "sfx.json"), JSON.stringify(eventos.sort((a, b) => a.t - b.t), null, 1));
await browser.close();
const mp4 = path.join(carpeta, "salida", "demo.mp4");
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", path.join(tmp, "%04d.jpg"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", mp4]);
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", mp4, "-vf", `fps=12/${SEG},scale=270:-2,tile=6x2:padding=4`, "-frames:v", "1", path.join(carpeta, "salida", "hoja.jpg")]);
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
console.log("listo:", mp4);
