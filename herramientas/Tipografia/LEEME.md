# Lector de toma para tipografía (03-11-2026)

`leer_toma.py` lee un video o una imagen y recomienda cómo poner texto (guía `INFORMACION DE CLAUDE\12-tipografia-audiovisual.md`, secciones 4 y 8).

```
"%USERPROFILE%\.claude\skills\efectos\.venv\Scripts\python.exe" leer_toma.py ARCHIVO [--n 8] [--paleta "#FFD23F,#FF3B5C"] [--region x,y,w,h] [--salida CARPETA] 2>nul
```
- Usa el Python del skill `/efectos` (trae MediaPipe, OpenCV y ffmpeg). `2>nul` oculta los avisos de las librerías.
- Sin `--region`: plano, caras, espacio libre sobre la cabeza (hook), bandas de VOZ con su tratamiento, energía y colores de acento. Guarda `lectura-<nombre>.png/.json` en `salida\`.
- Con `--region x,y,w,h` (lienzo de 1080×1920): evalúa solo esa caja de texto.
- Los umbrales (sombra / trazo / caja) son heurísticas calibradas con 4 cuadros; la caja no está probada. Detecta caras y silueta, no manos ni objetos.
- Calibración: coincidió con lo que vi a ojo en las hojas de prueba (sombra sola falla sobre camisa blanca; trazo funciona en todos los fondos probados).
