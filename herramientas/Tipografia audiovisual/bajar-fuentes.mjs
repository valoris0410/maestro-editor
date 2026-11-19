// Baja de Google Fonts (licencia OFL) las fuentes recomendadas en la guía 12, como TTF estáticos, a ./fuentes
import fs from "fs";
const LISTA = [
  ["Anton", ""], ["Inter", ":wght@400;500;600;800"], ["Instrument Serif", ":ital@0;1"], ["Playfair Display", ":ital,wght@0,700;1,700"],
  ["Montserrat", ":wght@700;800"], ["Oswald", ":wght@700"], ["Archivo", ":wght@900"], ["Rubik", ":wght@900"], ["Caveat", ":wght@700"],
  ["JetBrains Mono", ":wght@500;800"], ["Space Grotesk", ":wght@700"], ["Cormorant Garamond", ":ital,wght@1,500"],
  ["Permanent Marker", ""], ["Dancing Script", ":wght@700"], ["Poppins", ":wght@500;800"],
];
for (const [n, s] of LISTA) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${n.replace(/ /g, "+")}${s}`)).text();
  const bloques = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]);
  for (const b of bloques) {
    const url = (b.match(/url\((https:[^)]+\.ttf)\)/) || [])[1];
    if (!url) { console.log("sin ttf:", n); continue; }
    const peso = (b.match(/font-weight:\s*(\d+)/) || [])[1] || "400";
    const est = (b.match(/font-style:\s*(\w+)/) || [])[1] === "italic" ? "Italic" : "";
    const f = `fuentes/${n.replace(/ /g, "")}-${peso}${est}.ttf`;
    fs.writeFileSync(f, Buffer.from(await (await fetch(url)).arrayBuffer()));
    console.log("ok", f);
  }
}
fs.writeFileSync("fuentes/LICENCIAS.txt", "Fuentes de Google Fonts, publicadas casi todas bajo SIL Open Font License 1.1 (https://openfontlicense.org).\nUso comercial permitido, incluido video renderizado. No revender los archivos sueltos ni redistribuirlos modificados con el mismo nombre.\nPara certeza por familia, ver su ficha en https://fonts.google.com/specimen/<Nombre>. Descargadas el 03-11-2026.\n");
