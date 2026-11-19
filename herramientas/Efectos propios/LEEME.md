# Efectos propios (04-11-2026)

Los tres efectos del catálogo (`INFORMACION DE CLAUDE\13-catalogo-de-efectos.md`) que no existían en la skill `/efectos`. HTML + GSAP, con el sistema de la guía 12.

| Efecto | Función | Duración | Parámetros principales |
|---|---|---|---|
| **10 Zoom digital** | `EP.zoomDigital(tl, {...})` | 2,6 s + 0,22 s de vuelta | `t`, `cara: {cx, cy, w, h}`, `objetivo` (el video, "#bg"), `pasos: [[aumento, desde, duración], ...]` |
| **9 Garabatos vivos** | `EP.garabatos(tl, {...})` | ≈3,65 s | `t`, `cabeza: {cx, cy, r}`, `texto1`, `texto2`, `color`, `tinta`, `escala`, `semilla` |
| **2 Atraviesa la escena** | `EP.atraviesa(tl, {...})` | ≈3,3 s | `t`, `palabras` (3), `fondo`, `texto`, `anillo`, `escala` |

- La cara y la cabeza salen de `Herramientas\Tipografia\leer_toma.py` (campo `cara_caja` del JSON). Para la cabeza (con pelo o gorra), `r` ≈ 0,8 × el alto de la cara.
- Estilos: colores, textos y fuentes son parámetros; se usan los de la marca de la sesión (nunca los de la referencia).
- **Zoom digital**: acerca el elemento `objetivo` alrededor de la cara; no toca los subtítulos si están en otra capa. **Garabatos**: cada trazo lleva una capa oscura debajo para leerse sobre cualquier fondo.
  **Atraviesa la escena**: lo que haya debajo del efecto es la "escena siguiente"; el anillo es la primera letra de la última palabra.
- Las funciones miden texto: hay que llamarlas cuando las fuentes ya cargaron (`await document.fonts.load(...)`). Ver los `index.html` de `demos\`.

## Uso
1. `node "Maestro-Editor\Efectos propios\instalar-en-proyecto.mjs" "<proyecto>"` deja `assets/tipografia/` (guía 12) y `assets/efectos/` (estos efectos).
2. En el HTML: `tipografia.css`, `efectos-propios.css`, GSAP 3, `efectos-propios.js`; después `EP.zoomDigital(tl, {...})` sobre la línea de tiempo pausada.
3. Render por cuadros: `node render-proyecto.mjs "<carpeta con index.html>" <segundos>` → `salida\demo.mp4` y `salida\hoja.jpg` (12 cuadros para revisar).

## Estado de las pruebas
- Probados con render por cuadros sobre **un cuadro fijo** de una referencia ajena (B/N, plano medio corto), moviendo la línea de tiempo de GSAP. Las animaciones salen como se diseñaron.
- **No probados**: con video en movimiento (el zoom sobre video real depende de que la cara no se mueva mucho: ahora el zoom es fijo en un punto), dentro de HyperFrames, ni en CapCut (ahí se replican a mano).
- El **zoom digital** con la cara en movimiento necesita el seguimiento de cara cuadro a cuadro de la guía 03 para mover `cara` en el tiempo; hoy usa una posición fija.
- El de **garabatos** no está probado cuando la cabeza queda cerca de los bordes (los trazos se recortan a la zona segura, pero no se revisó cada caso).
- Dos errores de render que ya se resolvieron: devolver la línea de tiempo desde `page.evaluate` o `waitForFunction` cuelga a Chrome (devolver siempre un booleano o nada).
