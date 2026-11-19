// Genera muestrario.html con candidatas de Google Fonts (todas OFL/Apache) para probar ñ, tildes, ¿ ¡ y números.
// Uso: node muestrario.mjs   → luego chrome headless --screenshot
import fs from "fs";
const F = [
  ["Impacto condensado", [["Anton",""],["Bebas Neue",""],["Oswald",":wght@600;700"],["League Gothic",""],["Barlow Condensed",":wght@600;800"]]],
  ["Sans neutra / geométrica", [["Inter",":wght@400;800"],["Montserrat",":wght@500;800"],["Poppins",":wght@500;800"],["Plus Jakarta Sans",":wght@500;800"],["DM Sans",":wght@500;800"],["Manrope",":wght@500;800"],["Outfit",":wght@500;800"],["Lexend",":wght@500;800"]]],
  ["Grotesk con carácter", [["Archivo",":wght@500;900"],["Space Grotesk",":wght@500;700"],["Bricolage Grotesque",":wght@500;800"],["Sora",":wght@500;800"],["Unbounded",":wght@500;800"]]],
  ["Serif editorial", [["Playfair Display",":wght@500;800"],["Instrument Serif",""],["DM Serif Display",""],["Fraunces",":wght@500;800"],["Cormorant Garamond",":wght@500;700"],["Newsreader",":wght@500;800"],["Libre Baskerville",":wght@400;700"],["Bodoni Moda",":wght@500;800"]]],
  ["Manuscrita / firma", [["Dancing Script",":wght@500;700"],["Caveat",":wght@500;700"],["Permanent Marker",""],["Pacifico",""],["Homemade Apple",""],["Reenie Beanie",""],["Monsieur La Doulaise",""],["Mrs Saint Delafield",""],["Allura",""],["Kalam",":wght@400;700"]]],
  ["Mono / tecnica", [["JetBrains Mono",":wght@500;800"],["Space Mono",":wght@400;700"],["Courier Prime",":wght@400;700"],["IBM Plex Mono",":wght@500;700"]]],
  ["Pixel / retro", [["Press Start 2P",""],["VT323",""],["Silkscreen",":wght@400;700"]]],
  ["Juguetona / display", [["Bangers",""],["Lilita One",""],["Righteous",""],["Rubik",":wght@500;900"]]],
];
const url = (n, s) => `https://fonts.googleapis.com/css2?family=${n.replace(/ /g, "+")}${s}&display=swap`;
let h = `<!doctype html><meta charset=utf-8><title>Muestrario</title><style>
body{margin:0;background:#0B0E14;color:#F4F1EA;font:14px Arial;padding:24px;width:1650px}
h2{font:700 20px Arial;color:#FF2A54;margin:28px 0 8px;letter-spacing:.1em;text-transform:uppercase}
.g{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.c{border:1px solid #2a3140;border-radius:10px;padding:10px 14px}
.n{font:12px Arial;color:#8b93a7;margin-bottom:4px}
.s{font-size:34px;line-height:1.15}.m{font-size:22px;opacity:.85}
</style>`;
for (const [, fs_] of F) for (const [n, s] of fs_) h += `<link href="${url(n, s)}" rel=stylesheet>`;
for (const [g, fs_] of F) {
  h += `<h2>${g}</h2><div class=g>`;
  for (const [n, s] of fs_) {
    const w = /800|900|700/.test(s) ? (s.includes("900") ? 900 : 800) : 400;
    h += `<div class=c><div class=n>${n}</div><div class=s style="font-family:'${n}';font-weight:${w}">¿Qué hacés? Ñandú ÁÉÍÓÚ ü ¡Ya!</div><div class=m style="font-family:'${n}';font-weight:${w}">50 clientes · 23:40 · +3.700 · 100%</div></div>`;
  }
  h += `</div>`;
}
fs.writeFileSync("muestrario.html", h);
console.log("ok", F.flat().length);
