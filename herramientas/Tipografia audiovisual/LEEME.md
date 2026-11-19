# Tipografía audiovisual (03-11-2026)

Material de apoyo de la guía `INFORMACION DE CLAUDE\12-tipografia-audiovisual.md`.

- `fuentes\` → 23 TTF de 15 familias de Google Fonts (OFL) listos para HyperFrames o para instalar en Windows/CapCut. `LICENCIAS.txt`.
- `bajar-fuentes.mjs` → vuelve a bajarlas.
- `muestrario.mjs` → genera `muestrario.html` (51 fuentes con ñ, tildes, ¿ ¡ y cifras). Imagen: `pruebas\muestrario.png`.
- `pruebas\hojas.mjs` → genera `hoja-legibilidad.html` y `hoja-combos.html` sobre cuadros (`bgA/bgB/bgT/bgD.jpg`); se renderizan con Chrome headless:
  `chrome --headless=new --window-size=1860,2560 --virtual-time-budget=25000 --screenshot=<salida.png> <archivo.html>`
- `pruebas\hoja-legibilidad.png`, `pruebas\hoja-combos.png` → resultados.
- Los fondos de prueba incluyen clips b-roll de la persona y un cuadro de una referencia ajena (solo uso interno de prueba).
