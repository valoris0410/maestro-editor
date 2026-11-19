# Maestro Editor

Agente de edición de video y diseño gráfico para **Claude Code** (Windows 10/11). Trae los estilos de edición y diseño de Value Labs ya probados en reels reales:

- **Subtítulos de 4 capas:** voz palabra por palabra, golpe detrás de la persona, cursiva en neón y reglas de combinación tipográfica.
- **Tipografía audiovisual:** roles, combinaciones y gatillo mental según la tipografía.
- **Animaciones, cámara, zooms y transiciones.**
- **Efectos de sonido y música:** criterio, volúmenes y categorías.
- **Limpieza de audio, b-rolls, carruseles y piezas gráficas.**
- **19 efectos detrás y alrededor de la persona** con el skill `/efectos`.
- **Control de calidad y errores que no se deben repetir.**

## Qué hay adentro

| Carpeta o archivo | Qué es |
|---|---|
| `MANUAL-MAESTRO-EDITOR.md` | Todo el conocimiento de edición y diseño, en 20 secciones. **Empezá por acá.** |
| `skill/editor/` | El skill `/editor`. |
| `agente/editor.md` | El subagente `editor`. |
| `perfiles/` | El estilo de cada creador: una plantilla y el perfil de ejemplo, ya calibrado. |
| `herramientas/` | Motor de subtítulos, efectos, tipografía, MCP de CapCut, limpieza de voz, seguimiento de cara y análisis de video. |
| `instalar.ps1` + `configurar.py` | El instalador automático. |
| `INSTALAR.md` | El detalle de qué instala y qué queda a mano. |

## Instalar

1. Clonalo en una carpeta fija:
   ```
   git clone https://github.com/valoris0410/maestro-editor.git "$HOME\Documents\Maestro-Editor"
   ```
   Si no tenés Git, usá **Code → Download ZIP** y descomprimí el archivo.
2. Abrí PowerShell en esa carpeta y corré:
   ```
   powershell -ExecutionPolicy Bypass -File instalar.ps1
   ```
3. Cerrá Claude Code por completo y volvé a abrirlo. Después abrí CapCut una vez.
4. En Claude Code escribí `/editor` y pasale un video.

Otra opción: abrí Claude Code en la carpeta y escribile *"Instalá el Maestro Editor siguiendo INSTALAR.md"*.

La instalación tarda entre 10 y 20 minutos la primera vez. Hay cosas que quedan a mano: sonidos de Pixabay, la fuente Sinethar y los skills de Higgsfield, que son opcionales. Para generar imágenes y videos con IA, instalalos desde Higgsfield y corré `higgsfield auth login`. Están detalladas en `INSTALAR.md`.

## Licencias

- **Código y textos propios:** © Valentín Gómez (Value Labs). Se comparte para uso personal y profesional de quien lo recibe.
- **Componentes de terceros:** conservan su licencia original, en el archivo `LICENSE` o `LICENCIA` de cada carpeta.
  - VectCutAPI y efectos-skill: MIT.
  - DeepFilterNet: MIT/Apache.
  - Fuentes de Google Fonts: OFL.
- **Sonidos de Pixabay:** no se incluyen porque no se pueden redistribuir.
