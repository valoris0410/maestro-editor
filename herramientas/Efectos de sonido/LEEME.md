# Efectos de sonido (05-11-2026)

Guía de uso para las sesiones de marca: `INFORMACION DE CLAUDE\14-subtitulos-animaciones-y-sonido.md`.

- `mapa-sfx.json`: 12 categorías (impacto, zoom-in, whoosh, wosh-suave, flash-obturador, pop, riser, tap, click, contador, shine, digital-text) con volumen, prioridad, uso y términos de búsqueda en Pixabay; y qué sonido le toca a cada animación de `TIP`.
- `generar-sfx.mjs` → `biblioteca-sintetica\` (36 WAV, 3 variantes por categoría): **respaldo**; los reales de Pixabay (con el OK de la persona) tienen prioridad.
- `mezclar-sfx.mjs`: mezcla los efectos de un `sfx.json` en un video (volumen relativo al pico de la voz, límite por minuto, alterna variantes, -14 LUFS).
- `prueba-de-oido.mjs` → `prueba-de-oido.m4a` y `.txt`: los 36 sonidos seguidos, para que la persona escuche y apruebe o rechace.
- Límites: no puedo escuchar los sonidos; verifiqué tiempos y niveles. Sin la voz, los efectos quedan muy bajos (están pensados para ir bajo la voz): usar `--ganancia-extra 14` solo para escuchar demos.
