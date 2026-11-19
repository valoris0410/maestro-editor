// Instala en un proyecto el sistema tipográfico (guía 12) y los efectos propios.
// Uso: node instalar-en-proyecto.mjs "<carpeta del proyecto>"
// Deja <proyecto>/assets/tipografia/ y <proyecto>/assets/efectos/{efectos-propios.js, efectos-propios.css}
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const aqui = path.dirname(fileURLToPath(import.meta.url));
if (!process.argv[2]) { console.error('Uso: node instalar-en-proyecto.mjs "<carpeta del proyecto>"'); process.exit(1); }
const destino = path.resolve(process.argv[2]);
execFileSync("node", [path.join(aqui, "..", "Tipografia audiovisual", "sistema", "instalar-en-proyecto.mjs"), destino], { stdio: "inherit" });
const base = path.join(destino, "assets", "efectos");
fs.mkdirSync(base, { recursive: true });
for (const f of ["efectos-propios.js", "efectos-propios.css"]) fs.copyFileSync(path.join(aqui, "lib", f), path.join(base, f));
console.log("Listo:", base);
