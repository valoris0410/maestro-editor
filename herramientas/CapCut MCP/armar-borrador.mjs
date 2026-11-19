// Arma un borrador de CapCut completo desde un archivo de especificación (JSON), arrancando su propio MCP (VectCutAPI) por stdio.
// Sirve cuando el MCP registrado en la sesión está desactualizado (ej. antes de reiniciarlo) y para repetir una edición.
// Uso: node armar-borrador.mjs spec.json
// spec.json = {
//   "proyecto": "nombre que se ve en CapCut", "video": "ruta absoluta", "ancho": 1080, "alto": 1920,
//   "subtitulos": [{ "srt": "ruta", "track": "voz", "size": 10, "color": "#FFFFFF", "borde": "#000000", "anchoBorde": 40, "bold": true, "y": -0.33, "font": "opcional" }],
//   "textos":     [{ "text": "...", "start": 1, "end": 2, "size": 12, "color": "#FFD700", "sombra": true }],
//   "audios":     [{ "path": "ruta", "t": 1.5, "vol": 0.1 }],
//   "keyframes":  [{ "tipo": "uniform_scale", "t": 0, "valor": "1.0" }]
// }
// Después corre solo arreglar-borradores.mjs (draft_content.json y rutas). Cerrar CapCut del todo y reabrirlo para ver el proyecto.
import fs from "fs";
import path from "path";
import { spawn, spawnSync } from "child_process";
import readline from "readline";
import { fileURLToPath } from "url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const api = path.join(aqui, "VectCutAPI");
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const py = path.join(api, ".venv", "Scripts", "python.exe");
const hijo = spawn(py, ["mcp_server.py"], { cwd: api, stdio: ["pipe", "pipe", "ignore"] });
const rl = readline.createInterface({ input: hijo.stdout });
const espera = new Map(); let id = 0;
rl.on("line", (l) => { try { const m = JSON.parse(l); if (m.id && espera.has(m.id)) { espera.get(m.id)(m); espera.delete(m.id); } } catch {} });
const rpc = (method, params) => new Promise((res, rej) => { const i = ++id; espera.set(i, res); hijo.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: i, method, params }) + "\n"); setTimeout(() => rej(new Error("timeout " + method)), 180000); });
async function tool(name, args) {
  const r = await rpc("tools/call", { name, arguments: args });
  const t = r.result?.content?.[0]?.text ?? JSON.stringify(r);
  let j; try { j = JSON.parse(t); } catch { j = { texto: t }; }
  if (j.success === false || r.error) throw new Error(`${name}: ${j.error || JSON.stringify(r.error) || t}`);
  return j;
}
const existe = (p) => { if (!fs.existsSync(p)) throw new Error("no existe: " + p); return p; };
try {
  await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "armar-borrador", version: "1" } });
  hijo.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  const W = spec.ancho || 1080, H = spec.alto || 1920;
  const dur = await tool("get_video_duration", { video_url: existe(spec.video) });
  if (!dur.result?.duration?.success) throw new Error("ffprobe no pudo leer el video: " + JSON.stringify(dur.result));
  console.log("video:", dur.result.duration.output, "s");
  const c = await tool("create_draft", { width: W, height: H });
  const draft_id = c.result.draft_id;
  await tool("add_video", { draft_id, video_url: spec.video, start: 0, end: dur.result.duration.output, target_start: 0, width: W, height: H });
  for (const s of spec.subtitulos || []) {
    const a = { draft_id, srt_path: existe(s.srt), track_name: s.track || "subtitle", font_size: s.size ?? 10, font_color: s.color || "#FFFFFF",
      border_color: s.borde || "#000000", border_width: s.anchoBorde ?? 0, bold: s.bold ?? false, transform_y: s.y ?? -0.8, width: W, height: H };
    if (s.font) a.font = s.font;
    await tool("add_subtitle", a); console.log("subtítulos:", s.track || "subtitle");
  }
  for (const t of spec.textos || []) await tool("add_text", { draft_id, text: t.text, start: t.start, end: t.end, font_size: t.size ?? 12, font_color: t.color || "#FFFFFF", shadow_enabled: !!t.sombra });
  let n = 0;
  for (const a of spec.audios || []) { await tool("add_audio", { draft_id, audio_url: existe(a.path), target_start: a.t, volume: a.vol ?? 0.1, track_name: "sfx", width: W, height: H }); n++; }
  if (n) console.log("audios:", n);
  if ((spec.keyframes || []).length) await tool("add_video_keyframe", { draft_id, property_types: spec.keyframes.map((k) => k.tipo), times: spec.keyframes.map((k) => k.t), values: spec.keyframes.map((k) => String(k.valor)) });
  const g = await tool("save_draft", { draft_id, project_name: spec.proyecto });
  console.log("guardado en:", g.result.draft_url);
  const fx = spawnSync("node", [path.join(aqui, "arreglar-borradores.mjs"), spec.proyecto], { encoding: "utf8" });
  console.log(fx.stdout.trim());
} catch (e) { console.error("ERROR:", e.message); process.exitCode = 1; }
finally { hijo.kill(); }
