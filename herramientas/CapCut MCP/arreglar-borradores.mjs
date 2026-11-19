// CapCut 9.x lee el contenido de cada proyecto desde draft_content.json; el MCP (VectCutAPI) escribe draft_info.json.
// Este script copia draft_info.json -> draft_content.json en los borradores que no lo tienen (nunca pisa uno existente).
// Uso: node arreglar-borradores.mjs [nombre-del-borrador]   (sin nombre: revisa todos)
// Después: cerrar CapCut por completo (Administrador de tareas) y volver a abrirlo.
import fs from "fs";
import path from "path";

const raiz = path.join(process.env.LOCALAPPDATA, "CapCut", "User Data", "Projects", "com.lveditor.draft");
const solo = process.argv[2];
for (const d of fs.readdirSync(raiz, { withFileTypes: true })) {
  if (!d.isDirectory() || (solo && d.name !== solo)) continue;
  const info = path.join(raiz, d.name, "draft_info.json"), content = path.join(raiz, d.name, "draft_content.json");
  if (fs.existsSync(content)) { console.log(`= ${d.name}: ya tiene draft_content.json`); continue; }
  if (!fs.existsSync(info) || fs.statSync(info).size === 0) { console.log(`- ${d.name}: sin draft_info.json útil, no se toca`); continue; }
  // El MCP deja las rutas de video/audio apuntando a su carpeta temporal (VectCutAPI\dfd_cat_...\assets); se reapuntan a la del proyecto de CapCut.
  const destino = path.join(raiz, d.name, "assets").replace(/\\/g, "\\\\");   // escapado para JSON
  let texto = fs.readFileSync(info, "utf8");
  const antes = (texto.match(/VectCutAPI\\\\dfd_cat_[0-9a-z_]+\\\\assets/g) || []).length;
  texto = texto.replace(/[A-Za-z]:\\\\[^"]*?VectCutAPI\\\\dfd_cat_[0-9a-z_]+\\\\assets/g, destino);
  fs.writeFileSync(content, texto);
  fs.writeFileSync(info, texto);
  console.log(`+ ${d.name}: creado draft_content.json (${antes} rutas de medios reapuntadas al proyecto)`);
}
