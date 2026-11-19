// Renderiza index.html cuadro por cuadro (30 fps): mueve la línea de tiempo de GSAP (window.TL) y saca capturas.
// Uso: node render.mjs [segundos=6]   → salida/demo.mp4
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(new URL("../../../package.json", import.meta.url).href); // ya tiene puppeteer-core
const puppeteer = require("puppeteer-core");
const SEG = Number(process.argv[2] || 6), FPS = 30;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "demo-tip-"));
fs.mkdirSync(path.join(aqui, "salida"), { recursive: true });

const browser = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe"), headless: true, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto("file:///" + path.join(aqui, "index.html").replace(/\\/g, "/"), { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
const stage = await page.$("#stage");
for (let f = 0; f < SEG * FPS; f++) {
  await page.evaluate((t) => { window.TL.time(t, false); }, f / FPS); // sin return: devolver la línea de tiempo cuelga a Chrome al serializarla
  await stage.screenshot({ path: path.join(tmp, String(f).padStart(4, "0") + ".jpg"), type: "jpeg", quality: 92 });
}
await browser.close();
const mp4 = path.join(aqui, "salida", "demo.mp4");
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", path.join(tmp, "%04d.jpg"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", mp4]);
fs.cpSync(tmp, path.join(aqui, "salida", "cuadros"), { recursive: true });
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
console.log("listo:", mp4);
