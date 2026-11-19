// Detecta la cara en cada cuadro (5 fps) con MediaPipe Face Landmarker y guarda frente, pera y alto de la cara.
// Uso: node track.mjs <chrome.exe> <salida.json>
import http from "http";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const [chrome, outFile] = process.argv.slice(2);
const dir = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "frames");
const frames = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).sort();

const page = `<!doctype html><html><body><script type="module">
import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
const fs = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
const lm = await FaceLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: "CPU" }, runningMode: "IMAGE", numFaces: 1 });
window.detect = async (src) => {
  const img = new Image(); img.src = src; await img.decode();
  const r = lm.detect(img);
  if (!r.faceLandmarks.length) return null;
  const L = r.faceLandmarks[0];
  let minX = 1, maxX = 0; for (const p of L) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); }
  return { forehead: L[10].y, chin: L[152].y, left: minX, right: maxX };
};
window.ready = true;
</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.url === "/") { res.writeHead(200, { "content-type": "text/html" }); return res.end(page); }
  const f = path.join(dir, path.basename(req.url));
  if (fs.existsSync(f)) { res.writeHead(200, { "content-type": "image/jpeg" }); return res.end(fs.readFileSync(f)); }
  res.writeHead(404); res.end();
}).listen(8765);

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
const p = await browser.newPage();
p.on("console", (m) => console.log("page:", m.text()));
await p.goto("http://localhost:8765/");
await p.waitForFunction("window.ready === true", { timeout: 120000 });
const out = [];
for (const [i, f] of frames.entries()) {
  const r = await p.evaluate((s) => window.detect(s), "/" + f);
  out.push({ t: +(i / 5).toFixed(2), ...(r || { none: true }) });
  if (i % 50 === 0) console.log("frame", i, JSON.stringify(r));
}
fs.writeFileSync(outFile, JSON.stringify(out));
console.log("ok", out.length, "cuadros,", out.filter((x) => x.none).length, "sin cara");
await browser.close();
server.close();
