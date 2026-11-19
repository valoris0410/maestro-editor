"""Arma subtítulos desde un transcript.json (palabra por palabra) para CapCut o para una vista previa.
Uso: python armar-subtitulos.py transcript.json --salida <carpeta> [--correcciones correcciones.json] [--claves claves.json]
 - Texto base (VOZ): líneas de 2-4 palabras, corta en puntuación o pausa > 0,30 s, sin punto ni coma al final.
 - Palabras clave (ACENTO): frases de claves.json ("claves": ["freelancer", "4 de la tarde", ...]); salen en un SRT aparte
   (palabra grande, otro color) y se sacan del SRT base, de modo que se alternan sin superponerse.
 - correcciones.json: {"Fianza": "Finanza", ...} para errores de transcripción (verificar con la persona).
Salida: voz.srt, claves.srt, claves-eventos.json (segundo de cada clave, para anotar sonidos) e informe.json."""
import json, re, os, sys, argparse

ap = argparse.ArgumentParser()
ap.add_argument("transcript"); ap.add_argument("--salida", required=True)
ap.add_argument("--correcciones"); ap.add_argument("--claves")
ap.add_argument("--max-palabras", type=int, default=4); ap.add_argument("--pausa", type=float, default=0.30)
a = ap.parse_args()
os.makedirs(a.salida, exist_ok=True)
w = json.load(open(a.transcript, encoding="utf-8"))
corr = json.load(open(a.correcciones, encoding="utf-8")) if a.correcciones else {}
claves = json.load(open(a.claves, encoding="utf-8")).get("claves", []) if a.claves else []

def limpia(t):
    for k, v in corr.items(): t = re.sub(r"\b" + re.escape(k) + r"\b", v, t)
    return t
pal = [{"t": limpia(x["text"]), "s": x["start"], "e": x["end"]} for x in w]
norm = lambda s: re.sub(r"[^\wáéíóúüñ%]", "", s.lower())

# 1) marcar palabras clave (secuencias exactas)
marca = [None] * len(pal)
for ci, frase in enumerate(sorted(claves, key=lambda f: -len(f.split()))):
    fw = [norm(x) for x in frase.split()]
    for i in range(len(pal) - len(fw) + 1):
        if all(marca[i + j] is None for j in range(len(fw))) and [norm(pal[i + j]["t"]) for j in range(len(fw))] == fw:
            for j in range(len(fw)): marca[i + j] = (frase, i)
# 2) segmentos: runs de clave y runs de base
segs = []
for i, p in enumerate(pal):
    k = marca[i]
    ident = ("K", k[1]) if k else ("V", None)     # k[1] = índice donde empieza esa frase clave: distingue claves seguidas
    if segs and segs[-1]["ident"] == ident:
        segs[-1]["p"].append(p)
    else:
        segs.append({"tipo": ident[0], "ident": ident, "p": [p]})

def fin_oracion(t): return bool(re.search(r"[.!?…]$", t))
voz, kl = [], []
for sg in segs:
    if sg["tipo"] == "K":
        kl.append((sg["p"][0]["s"], sg["p"][-1]["e"], " ".join(x["t"] for x in sg["p"]).strip(" .,;:¡!¿?"))); continue
    cur = []
    def vuelca():
        global cur
        if cur: voz.append((cur[0]["s"], cur[-1]["e"], " ".join(x["t"] for x in cur))); cur = []
    for i, p in enumerate(sg["p"]):
        if cur and (p["s"] - cur[-1]["e"] > a.pausa): vuelca()
        cur.append(p)
        if len(cur) >= a.max_palabras or re.search(r"[.,;:?!]$", p["t"]): vuelca()
    vuelca()
# unir líneas de 1 palabra con la vecina si caben
lim = lambda t: t.strip().rstrip(".,;:").strip()
voz = [(s, e, lim(t)) for s, e, t in voz]
# 3) duración: alargar hasta 0,83 s sin pisar la siguiente (voz y claves comparten línea de tiempo)
todo = sorted([("V", s, e, t) for s, e, t in voz] + [("K", s, e, t) for s, e, t in kl], key=lambda x: x[1])
# unir fragmentos de 1 palabra (o < 0,45 s) con la línea de voz vecina, para que no parpadeen
nw = lambda t: len(t.split())
cambio = True
while cambio:
    cambio = False
    for i, (tp, s, e, t) in enumerate(todo):
        if tp != "V" or not (nw(t) <= 1 or e - s < 0.45): continue
        ant = todo[i - 1] if i > 0 else None; sig = todo[i + 1] if i + 1 < len(todo) else None
        if ant and ant[0] == "V" and s - ant[2] < 0.25 and nw(ant[3]) + nw(t) <= a.max_palabras + 1:
            todo[i - 1] = ("V", ant[1], e, ant[3] + " " + t); del todo[i]; cambio = True; break
        if sig and sig[0] == "V" and sig[1] - e < 0.25 and nw(sig[3]) + nw(t) <= a.max_palabras + 1:
            todo[i + 1] = ("V", s, sig[2], t + " " + sig[3]); del todo[i]; cambio = True; break
res = []
for idx, (tp, s, e, t) in enumerate(todo):
    sig = todo[idx + 1][1] if idx + 1 < len(todo) else e + 1
    e2 = max(e, min(s + 0.83, sig - 0.02)); res.append((tp, round(s, 2), round(e2, 2), t))
def ts(x):
    h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
def srt(items, path):
    with open(path, "w", encoding="utf-8") as f:
        for n, (tp, s, e, t) in enumerate(items, 1): f.write(f"{n}\n{ts(s)} --> {ts(e)}\n{t}\n\n")
srt([r for r in res if r[0] == "V"], os.path.join(a.salida, "voz.srt"))
srt([r for r in res if r[0] == "K"], os.path.join(a.salida, "claves.srt"))
json.dump([{"t": s, "frase": t} for tp, s, e, t in res if tp == "K"], open(os.path.join(a.salida, "claves-eventos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
cps = [len(t.replace(" ", "")) / max(e - s, 0.01) for tp, s, e, t in res]
inf = {"lineas_voz": sum(r[0] == "V" for r in res), "claves": sum(r[0] == "K" for r in res),
       "cps_max": round(max(cps), 1), "cps_promedio": round(sum(cps) / len(cps), 1),
       "lineas_sobre_20cps": [r for r, c in zip(res, cps) if c > 20][:10]}
json.dump(inf, open(os.path.join(a.salida, "informe.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps(inf, ensure_ascii=False, indent=1))
