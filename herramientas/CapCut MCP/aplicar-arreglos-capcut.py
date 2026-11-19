"""Aplica los dos arreglos que necesita el MCP de CapCut (VectCutAPI) para que los subtítulos funcionen.
Uso: python aplicar-arreglos-capcut.py "<carpeta de VectCutAPI>"
 1) add_subtitle_impl.py: el original trae vertical=True por defecto -> CapCut muestra los subtítulos girados 90°.
 2) pyJianYingDraft/script_file.py: sin elegir fuente, add_subtitle falla con "font_type" (variable sin valor)."""
import os, sys
base = sys.argv[1]
a = os.path.join(base, "add_subtitle_impl.py")
s = open(a, encoding="utf-8").read()
if "vertical: bool = True" in s:
    s = s.replace("vertical: bool = True", "vertical: bool = False"); open(a, "w", encoding="utf-8").write(s); print("arreglado: vertical=False en", a)
else: print("ya estaba (o cambió el archivo):", a)
b = os.path.join(base, "pyJianYingDraft", "script_file.py")
s = open(b, encoding="utf-8").read()
viejo = "        if font:\n            try:\n                font_type = getattr(Font_type, font)"
if viejo in s and "font_type = None  # arreglo" not in s:
    s = s.replace(viejo, "        font_type = None  # arreglo: sin fuente elegida fallaba add_subtitle\n" + viejo, 1)
    open(b, "w", encoding="utf-8").write(s); print("arreglado: font_type en", b)
else: print("ya estaba (o cambió el archivo):", b)
