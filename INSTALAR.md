# Instalar el Maestro Editor (Windows 10/11): automático

## Lo único que hace falta antes
- **Claude Code** instalado (app de escritorio o terminal) y con sesión iniciada.
- **Internet** (baja programas y modelos). Tarda entre 10 y 20 minutos la primera vez.

## Instalación
1. Descomprimí el zip en una carpeta **fija**, por ejemplo `Documentos\Maestro-Editor`. Si la movés después, volvé a correr el instalador.
2. Abrí esa carpeta, hacé clic derecho en un lugar vacío y elegí "Abrir en Terminal" (o abrí PowerShell ahí).
3. Corré:
   ```
   powershell -ExecutionPolicy Bypass -File instalar.ps1
   ```
4. Cuando termine: **cerrá Claude Code por completo y abrilo de nuevo**, abrí CapCut una vez y escribí `/editor`.

## Qué instala solo
| Qué | Para qué |
|---|---|
| Git, Node.js, ffmpeg, Python 3.12, Google Chrome, CapCut (con winget) | los programas base |
| Skill **`/editor`** y subagente **`editor`** | el agente editor, apuntando a esta carpeta |
| Bloque de instrucciones en `~\.claude\CLAUDE.md` | que cualquier chat sepa que existe el editor y sus reglas (no borra lo que ya tenías) |
| Skill **`/efectos`** (19 efectos detrás y alrededor de la persona) | con su entorno de Python, MediaPipe y modelos |
| Skill **`ffmpeg-skill`** | cortar silencios, loudness, 9:16, exportes, chequeo final |
| 9 skills **`higgsfield-*`** + programa `higgsfield` | generar imágenes y videos con IA, video sin cara, miniaturas, brandkit |
| **MCP de CapCut** (VectCutAPI, ya corregido) | que Claude arme borradores en CapCut |
| HyperFrames + Parakeet | transcripción con tiempo por palabra |
| DeepFilterNet | limpiar ruido de la voz |
| Fuentes libres (OFL) en Windows | para el render y para CapCut |
| `puppeteer-core` | motor de subtítulos de 4 capas |

Si algo falla, el instalador sigue con lo demás y al final muestra la lista de avisos. Todo queda registrado en `instalar-log.txt`. Se puede correr las veces que haga falta: lo que ya está, lo saltea.

## Lo que queda a mano (por seguridad o porque es una cuenta tuya)
- **Higgsfield:** iniciar sesión una vez con `higgsfield auth login`. Usa los créditos de la cuenta de Higgsfield con la que entres.
- **Conectores de claude.ai** (Canva, Google Drive, etc.): son de la cuenta de Claude. Si usás la misma cuenta, ya los tenés; si no, se conectan desde claude.ai, en Configuración → Conectores.
- **Sonidos:** los de Pixabay no se pueden redistribuir. Bajalos de pixabay.com/sound-effects con los términos del manual (§9), guardalos en `herramientas\Efectos de sonido\biblioteca-real\` con nombres que empiecen por la categoría (`pop-123-1.mp3`) y corré `node preparar-biblioteca.mjs` en esa carpeta. La lista original está en `biblioteca-real\lista.txt`.
- **Fuente Sinethar** (la cursiva de los subtítulos): requiere licencia comercial. Si no la tenés, se usa Dancing Script.

## Primer uso
1. Copiá `perfiles\_PLANTILLA.md` como `perfiles\<tu nombre>.md`. `perfiles\Valentin.md` es un ejemplo ya calibrado.
2. Pasale a Claude 2 o 3 videos que te gusten **sin decirle nada**: los toma como referencias y aprende tu estilo.
3. Pedí: "/editor editá este video: <ruta>, objetivo ___". Primero te muestra un plan.

## Límites honestos
El agente no oye audio (sonidos y música se validan de oído) y ve el video por cuadros. CapCut no hace el glow ni el texto detrás de la persona: eso sale del render propio. Lista completa en el manual, §20.
