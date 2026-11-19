# CapCut MCP (26-10-2026)

Conecta Claude Code con CapCut de escritorio: Claude arma **borradores** (cortes, subtítulos, textos, audio, efectos)
que aparecen en CapCut como proyectos propios; la persona los abre, retoca y exporta.

- `VectCutAPI/` → repo sun-guannan/VectCutAPI (commit 48f8ff9, 24-10-2026). Trae su propio servidor MCP (`mcp_server.py`, Python).
- `capcut-mcp-server-extended/` → wrapper en TypeScript (MigueDuque). **No se usa**: el MCP de VectCutAPI alcanza.
- Python 3.12 instalado con winget en `%LOCALAPPDATA%\Programs\Python\Python312`.

## Revisión de seguridad (hecha antes de instalar)
- `oss.py` sube borradores a la nube de Alibaba **solo si** `is_upload_draft: true` → en `config.json` está en `false`.
- `save_draft_impl.query_script_impl` consulta un servidor en Hong Kong: es para bajar borradores de su nube paga; el MCP no lo usa.
- El MCP devuelve un link `install-ai-guider.top` como texto: es solo informativo, no se llama.
- Carpeta de borradores en Windows (automática): `%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft`.

## Compatibilidad
El perfil `capcut_legacy` imita CapCut 6.5. Versiones nuevas (10.x) pueden rechazar o no abrir el borrador: probar con uno chico primero.

## Estado (26-10-2026)
- Dependencias instaladas en `VectCutAPI\.venv` (aprobado por la persona).
- MCP registrado como `capcut` en `~/.claude.json` (respaldo previo: `~/.claude.json.bak-capcut`).
- Probado por stdio: responde y carga 11 herramientas (create_draft, add_video, add_audio, add_image, add_text, add_subtitle,
  add_effect, add_sticker, add_video_keyframe, get_video_duration, save_draft).

## Prueba real (08-11-2026) — CapCut 9.6.0.4097
- CapCut instalado; carpeta de borradores `%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft`.
- Borrador de prueba "PRUEBA Claude MCP" (video de 6 s + texto) creado con `create_draft` → `add_video` → `add_text` → `save_draft(project_name=...)`.
- **Problema:** el proyecto quedaba en el índice pero CapCut no lo mostraba. CapCut 9.x busca `draft_content.json`; el MCP escribe `draft_info.json`.
- **Arreglo:** `node arreglar-borradores.mjs "<nombre>"` copia `draft_info.json` → `draft_content.json`. Después **cerrar CapCut del todo (Administrador de tareas, hay varios procesos) y reabrirlo**. Con eso el proyecto aparece (confirmado por la persona).
- **Pasos para usarlo siempre:** armar el borrador → guardar con `project_name` → correr `arreglar-borradores.mjs` → reiniciar CapCut → abrir el proyecto.
- Confirmado por la persona: el borrador aparece y el texto amarillo se ve en la parte baja.
- **Error "video y descarga del material" (08-11-2026):** en las dos primeras pruebas puse una ruta de video que no existía (`Efectos propios\demo-con-sonido.mp4`; está en `demos\<efecto>\salida\`). El MCP no avisa: guarda igual con duración 0 y sin copiar el video. **Antes de `add_video`, verificar que el archivo existe y que `get_video_duration` devuelve `success: true`.**
- `arreglar-borradores.mjs` ahora además reapunta las rutas de medios (el MCP las deja en `VectCutAPI\dfd_cat_...\assets`) a la carpeta `assets` del proyecto de CapCut. Los medios se copian a `<proyecto>\assets\video|audio`.
- `video_url` / `audio_url` / `srt_path`: rutas absolutas locales (funcionan). Un SRT con una hora mal escrita (`00:00:3,000`) puede romper los subtítulos: usar siempre `HH:MM:SS,mmm`.
- **Bug del MCP corregido en nuestra copia** (`pyJianYingDraft\script_file.py`, `add_subtitle`): sin pasar `font`, fallaba con "font_type". Tras reiniciar el MCP ya no hace falta pasar fuente; hasta entonces usar `font: "Inter_Black"` (nombres en `pyJianYingDraft\metadata\font_meta.py`).
- Borrador de prueba completo: `PRUEBA 3 Claude MCP` (2 cortes de `10-zoom-digital`, disolvencia, 3 subtítulos Inter Black con borde, sonido `impacto-01`, zoom 100→115 %). Las pruebas 1 y 2 quedaron rotas (sin video): borrarlas desde CapCut.

## Pendiente
1. Que la persona abra "PRUEBA Claude MCP" y confirme que el video y el texto se ven bien.
2. Probar subtítulos (`add_subtitle`), audio (`add_audio`) y las transiciones/efectos disponibles en 9.6.
3. Integrar `arreglar-borradores.mjs` al flujo del agente editor.

## armar-borrador.mjs (08-11-2026)
`node armar-borrador.mjs spec.json` arma un borrador completo en CapCut (video, subtítulos en varias pistas con color/borde, sonidos con segundo y volumen, zoom por keyframes) arrancando su propio MCP de VectCutAPI con el arreglo de `add_subtitle`, y corre `arreglar-borradores.mjs`. Formato de `spec.json` en la cabecera del script. Primera prueba real: `PRUEBA ads2 deseo (editor)` (129 s, 128 subtítulos + 15 claves + 6 sonidos), verificado en el JSON del borrador; falta que la persona lo abra en CapCut.
