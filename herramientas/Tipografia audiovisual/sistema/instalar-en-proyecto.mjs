// Copia el sistema tipográfico a un proyecto (HyperFrames o HTML de carrusel) para que funcione sin rutas externas.
// Uso: node instalar-en-proyecto.mjs "<carpeta del proyecto>"
// Deja <proyecto>/assets/tipografia/{tipografia.css, entradas.js, fuentes/*.ttf}. En el HTML:
//   <link rel="stylesheet" href="assets/tipografia/tipografia.css"> ... <script src="assets/tipografia/entradas.js"></script>
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const destino = path.resolve(process.argv[2] || "");
if (!process.argv[2]) { console.error('Uso: node instalar-en-proyecto.mjs "<carpeta del proyecto>"'); process.exit(1); }
const base = path.join(destino, "assets", "tipografia");
fs.mkdirSync(path.join(base, "fuentes"), { recursive: true });
fs.copyFileSync(path.join(aqui, "entradas.js"), path.join(base, "entradas.js"));
// el CSS apunta a ../fuentes (carpeta hermana de /sistema); en el proyecto las fuentes quedan en ./fuentes
fs.writeFileSync(path.join(base, "tipografia.css"), fs.readFileSync(path.join(aqui, "tipografia.css"), "utf8").replaceAll('url("../fuentes/', 'url("fuentes/'));
const origen = path.join(aqui, "..", "fuentes");
let n = 0;
for (const f of fs.readdirSync(origen).filter((f) => f.endsWith(".ttf"))) { fs.copyFileSync(path.join(origen, f), path.join(base, "fuentes", f)); n++; }
console.log(`Listo: ${base} (css, js y ${n} fuentes)`);
