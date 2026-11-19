"""Transcript (palabra por palabra) -> plan.json para el motor de subtítulos (render-subtitulos.mjs).
Uso: python plan-subtitulos.py transcript.json --salida plan.json [--correcciones c.json] [--claves k.json] [--desde 0 --hasta 25]
claves.json: {"claves": ["freelancer", {"frase": "4 de la tarde", "tipo": "golpe"}, {"frase": "ya hecho", "tipo": "cursiva"}]}
  tipo "golpe" (por defecto) = palabra clave gigante condensada con glow; "cursiva" = acento manuscrito de neón rotado.
Capas del plan (guía 02, "Manual de estilo de edición"): voz (subtítulo base, línea de 2-4 palabras con entrada palabra a palabra),
golpe (palabra clave), cursiva (acento). Las claves se sacan de la voz para no repetirse ni superponerse."""
import json, re, argparse

ap = argparse.ArgumentParser()
ap.add_argument("transcript"); ap.add_argument("--salida", required=True)
ap.add_argument("--correcciones"); ap.add_argument("--claves")
ap.add_argument("--desde", type=float, default=0); ap.add_argument("--hasta", type=float, default=1e9)
ap.add_argument("--max-palabras", type=int, default=4); ap.add_argument("--pausa", type=float, default=0.30)
a = ap.parse_args()

corr = json.load(open(a.correcciones, encoding="utf-8")) if a.correcciones else {}
claves = json.load(open(a.claves, encoding="utf-8")).get("claves", []) if a.claves else []
claves = [{"frase": c, "tipo": "golpe"} if isinstance(c, str) else c for c in claves]

def limpia(t):
    for k, v in corr.items(): t = re.sub(r"\b" + re.escape(k) + r"\b", v, t)
    return t
raw = json.load(open(a.transcript, encoding="utf-8"))
pal = [{"t": limpia(x["text"]), "s": x["start"], "e": x["end"]} for x in raw if a.desde <= x["start"] <= a.hasta]
norm = lambda s: re.sub(r"[^\wáéíóúüñ%]", "", s.lower())
marca = [None] * len(pal)
for c in sorted(claves, key=lambda c: -len(c["frase"].split())):
    fw = [norm(x) for x in c["frase"].split()]
    for i in range(len(pal) - len(fw) + 1):
        if all(marca[i + j] is None for j in range(len(fw))) and [norm(pal[i + j]["t"]) for j in range(len(fw))] == fw:
            for j in range(len(fw)): marca[i + j] = (c["tipo"], i)

# runs
runs = []
for i, p in enumerate(pal):
    ident = marca[i] or ("voz", None)
    if runs and runs[-1]["id"] == ident: runs[-1]["p"].append(p)
    else: runs.append({"id": ident, "tipo": ident[0], "p": [p]})
limpiaP = lambda t: t.strip(" .,;:¡!¿?…")
items = []
for r in runs:
    if r["tipo"] != "voz":
        items.append({"tipo": r["tipo"], "p": r["p"]}); continue
    cur = []
    def vuelca():
        global cur
        if cur: items.append({"tipo": "voz", "p": cur}); cur = []
    for p in r["p"]:
        if cur and p["s"] - cur[-1]["e"] > a.pausa: vuelca()
        cur.append(p)
        if len(cur) >= a.max_palabras or re.search(r"[.,;:?!]$", p["t"]): vuelca()
    vuelca()
# unir fragmentos de 1 palabra con la vecina
nw = lambda it: len(it["p"])
ch = True
while ch:
    ch = False
    for i, it in enumerate(items):
        if it["tipo"] != "voz" or nw(it) > 1: continue
        ant = items[i - 1] if i else None; sig = items[i + 1] if i + 1 < len(items) else None
        if ant and ant["tipo"] == "voz" and it["p"][0]["s"] - ant["p"][-1]["e"] < 0.25 and nw(ant) < a.max_palabras + 1:
            ant["p"] += it["p"]; del items[i]; ch = True; break
        if sig and sig["tipo"] == "voz" and sig["p"][0]["s"] - it["p"][-1]["e"] < 0.25 and nw(sig) < a.max_palabras + 1:
            sig["p"] = it["p"] + sig["p"]; del items[i]; ch = True; break
# tiempos: entra con su primera palabra; se queda hasta que termina + 0,25 s (claves 0,45 s), sin pisar a la siguiente de su capa
out = {"voz": [], "golpe": [], "cursiva": []}
for tipo in out:
    capa = [it for it in items if it["tipo"] == tipo]
    for k, it in enumerate(capa):
        t0 = it["p"][0]["s"]; fin = it["p"][-1]["e"] + (0.45 if tipo != "voz" else 0.25)
        if tipo != "voz": fin = max(fin, t0 + 0.9)
        sig = capa[k + 1]["p"][0]["s"] - 0.04 if k + 1 < len(capa) else 1e9
        out[tipo].append({"t0": round(t0, 3), "t1": round(min(fin, sig), 3),
                          "palabras": [{"t": round(p["s"], 3), "txt": limpiaP(p["t"]) if tipo != "voz" else p["t"].rstrip(".,;:").strip()} for p in it["p"]]})
# la voz no se muestra mientras hay una clave de la misma frase (ya se sacó); cuando hay golpe/cursiva activos, la voz sigue por otras palabras
json.dump(out, open(a.salida, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in out.items()})
