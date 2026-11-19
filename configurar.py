"""Configura Claude Code para el Maestro Editor (lo llama instalar.ps1; se puede correr de nuevo sin romper nada).
Uso: python configurar.py <carpeta Maestro-Editor> <python del venv de VectCutAPI>
 1) skill /editor y subagente "editor" en ~/.claude (con la ruta real de la carpeta)
 2) skill /efectos en ~/.claude/skills/efectos (si no estaba)
 3) instrucciones globales: un bloque en ~/.claude/CLAUDE.md (no borra lo que ya hay)
 4) MCP de CapCut registrado en ~/.claude.json (con copia de respaldo)
 5) fuentes libres instaladas en Windows (para usarlas también en CapCut)"""
import json, os, shutil, sys, glob

R = os.path.abspath(sys.argv[1]); VPY = sys.argv[2] if len(sys.argv) > 2 else ""
C = os.path.join(os.path.expanduser("~"), ".claude")
ok = lambda m: print("  OK  ", m)

# 1) skill y subagente
for src, dst in [(os.path.join(R, "skill", "editor", "SKILL.md"), os.path.join(C, "skills", "editor", "SKILL.md")),
                 (os.path.join(R, "agente", "editor.md"), os.path.join(C, "agents", "editor.md"))]:
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, "w", encoding="utf-8").write(open(src, encoding="utf-8").read().replace("RUTA_MAESTRO", R))
    ok(dst)

# 2) skill /efectos
ef = os.path.join(C, "skills", "efectos")
if not os.path.isdir(ef):
    shutil.copytree(os.path.join(R, "herramientas", "efectos-skill"), ef); ok("skill /efectos copiado en " + ef)
else: ok("skill /efectos ya estaba")

# 2b) skills extra (Higgsfield: generar video e imagen, video sin cara, miniaturas, brandkit...)
extra = os.path.join(R, "skills-extra")
if os.path.isdir(extra):
    for s in sorted(os.listdir(extra)):
        d = os.path.join(C, "skills", s)
        if os.path.isdir(d): shutil.rmtree(d)
        shutil.copytree(os.path.join(extra, s), d)
    ok(f"{len(os.listdir(extra))} skills extra en {os.path.join(C, 'skills')}")

# 3) instrucciones globales
MI, MF = "<!-- MAESTRO-EDITOR: inicio (lo agrega el instalador; se reemplaza al reinstalar) -->", "<!-- MAESTRO-EDITOR: fin -->"
bloque = f"""{MI}
## Maestro Editor (edición de video y diseño gráfico)
Antes de editar video, subtitular, cortar, mejorar audio, elegir b-rolls o diseñar carruseles y piezas gráficas, leé
`{os.path.join(R, 'MANUAL-MAESTRO-EDITOR.md')}` y usá el skill `/editor` (o el subagente `editor`). Perfiles por creador: `{os.path.join(R, 'perfiles')}`.
- Subtítulos siempre con el sistema de 4 capas del manual (nunca subtítulo plano ni quemado con ffmpeg).
- Lo que se cree, descargue o instale para editar va dentro de `{R}` o de la carpeta del proyecto, nunca suelto en el Escritorio.
- Videos que te pasen sin texto = referencias: analizarlos y anotar lo aprendido en el manual o en el perfil del creador.
- Toda corrección o aprobación se escribe con fecha en el manual o en el perfil, no solo en la memoria del chat.
{MF}
"""
# 3b) información de Valentín (mi-info): sus instrucciones y reglas, con las rutas de su PC traducidas a esta
mi = os.path.join(R, "mi-info")
if os.path.isdir(mi):
    def traducir(t):
        for viejo, nuevo in [(r"C:\Users\srval\Desktop\CLAUDE FOLDERS", os.path.join(mi, "CLAUDE FOLDERS")),
                             (r"C:\Users\srval\Desktop\Valoris", os.path.join(mi, "Escritorio", "Valoris")),
                             (r"C:\Users\srval\Desktop\Value Agency", os.path.join(mi, "Escritorio", "Value Agency")),
                             ("C:/Users/srval/Desktop/CLAUDE FOLDERS", os.path.join(mi, "CLAUDE FOLDERS").replace("\\", "/"))]:
            t = t.replace(viejo, nuevo)
        return t
    extra = f"""
### Información de Valentín (Value Labs) para editar
Esta PC la usa una compañera de Valentín. Las instrucciones de abajo son las de Valentín (dueño de Value Labs): aplicalas al trabajo de edición y diseño
(cuando dicen "soy Valentín", se refieren a él). Su información está en `{mi}`.
**Traducción de rutas:** si algún documento todavía menciona rutas de la PC de Valentín, usá estas equivalencias:
- `C:\\Users\\srval\\Desktop\\CLAUDE FOLDERS\\...` → `{os.path.join(mi, 'CLAUDE FOLDERS')}\\...`
- `C:\\Users\\srval\\Desktop\\Valoris\\...` → `{os.path.join(mi, 'Escritorio', 'Valoris')}\\...`
- `C:\\Users\\srval\\Desktop\\Value Agency\\...` → `{os.path.join(mi, 'Escritorio', 'Value Agency')}\\...`
- `CLAUDE FOLDERS\\...` (ruta corta, sin el comienzo) → `{os.path.join(mi, 'CLAUDE FOLDERS')}\\...`
- `Maestro Editor\\Herramientas\\...` → `{os.path.join(R, 'herramientas')}\\...` (las herramientas instaladas en esta PC)
- `%USERPROFILE%\\.claude\\...` y `~\\.claude\\...` son los de esta PC.
Reglas aprendidas en el chat Maestro Editor: `{os.path.join(mi, 'reglas-del-cerebro.md')}` (leelas antes de editar).

#### Instrucciones de Valentín (copia, rutas traducidas)
"""
    if os.path.exists(os.path.join(mi, "CLAUDE-de-Valentin.md")):
        extra += traducir(open(os.path.join(mi, "CLAUDE-de-Valentin.md"), encoding="utf-8").read()).replace("\n# ", "\n#### ").replace("\n## ", "\n#### ")
    bloque = bloque.replace(MF, extra.rstrip() + "\n" + MF)
    # que las guías copiadas apunten a esta PC (solo dentro de mi-info, no toca nada más)
    n = 0
    for r_, _, fs in os.walk(mi):
        for f in fs:
            if f.endswith(".md"):
                p = os.path.join(r_, f)
                try: t = open(p, encoding="utf-8").read()
                except Exception: continue
                t2 = traducir(t)
                if t2 != t: open(p, "w", encoding="utf-8").write(t2); n += 1
    ok(f"información de Valentín cargada; rutas traducidas en {n} documentos")

cm = os.path.join(C, "CLAUDE.md")
txt = open(cm, encoding="utf-8").read() if os.path.exists(cm) else ""
if MI in txt and MF in txt:
    txt = txt[:txt.index(MI)] + bloque.strip() + txt[txt.index(MF) + len(MF):]
else:
    txt = (txt.rstrip() + "\n\n" if txt.strip() else "") + bloque
open(cm, "w", encoding="utf-8").write(txt); ok("instrucciones en " + cm)

# 4) MCP de CapCut
api = os.path.join(R, "herramientas", "CapCut MCP", "VectCutAPI")
if VPY and os.path.exists(VPY) and os.path.exists(os.path.join(api, "mcp_server.py")):
    cj = os.path.join(os.path.expanduser("~"), ".claude.json")
    data = {}
    if os.path.exists(cj):
        shutil.copy2(cj, cj + ".bak-maestro-editor")
        data = json.load(open(cj, encoding="utf-8"))
    data.setdefault("mcpServers", {})["capcut"] = {"type": "stdio", "command": VPY.replace("\\", "/"),
                                                    "args": [os.path.join(api, "mcp_server.py").replace("\\", "/")], "env": {}}
    json.dump(data, open(cj, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    ok("MCP 'capcut' registrado en " + cj + " (respaldo: .claude.json.bak-maestro-editor)")
else:
    print("  --   MCP de CapCut no registrado (falta el entorno de Python de VectCutAPI)")

# 5) fuentes (por usuario, sin permisos de administrador)
if os.environ.get("MAESTRO_SIN_FUENTES"):
    print("  --   fuentes salteadas (MAESTRO_SIN_FUENTES)"); sys.exit(0)
try:
    import winreg
    fdir = os.path.join(os.environ["LOCALAPPDATA"], "Microsoft", "Windows", "Fonts"); os.makedirs(fdir, exist_ok=True)
    k = winreg.CreateKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows NT\CurrentVersion\Fonts")
    n = 0
    for f in glob.glob(os.path.join(R, "herramientas", "Tipografia audiovisual", "fuentes", "*.[ot]tf")):
        d = os.path.join(fdir, os.path.basename(f))
        if not os.path.exists(d): shutil.copy2(f, d)
        nombre = os.path.splitext(os.path.basename(f))[0] + (" (TrueType)" if f.lower().endswith(".ttf") else " (OpenType)")
        winreg.SetValueEx(k, nombre, 0, winreg.REG_SZ, d); n += 1
    ok(f"{n} fuentes instaladas para este usuario (CapCut las ve al reiniciarlo)")
except Exception as e:
    print("  --   no se pudieron instalar las fuentes:", e)
