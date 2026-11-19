"""Máscara de la persona (cuadro por cuadro) para poner texto DETRÁS de ella.
Usa el segmentador de MediaPipe que ya trae el skill /efectos (corre con su .venv):
  "%USERPROFILE%\\.claude\\skills\\efectos\\.venv\\Scripts\\python.exe" matte.py video.mp4 --salida carpeta [--desde 0 --hasta 25 --fps 30 --ancho 1080 --alto 1920]
Escribe carpeta\\0000.png ... (gris: blanco = persona). Suavizado en el tiempo según cuánto cambia cada píxel."""
import os, sys, argparse
import numpy as np, cv2

SK = os.path.join(os.path.expanduser("~"), ".claude", "skills", "efectos")
sys.path.insert(0, SK)
from motor.persona import Modelos

ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("--salida", required=True)
ap.add_argument("--desde", type=float, default=0); ap.add_argument("--hasta", type=float, default=1e9)
ap.add_argument("--fps", type=float, default=30); ap.add_argument("--ancho", type=int, default=1080); ap.add_argument("--alto", type=int, default=1920)
a = ap.parse_args()
os.makedirs(a.salida, exist_ok=True)
cap = cv2.VideoCapture(a.video)
vfps = cap.get(cv2.CAP_PROP_FPS) or 30
total = cap.get(cv2.CAP_PROP_FRAME_COUNT) / vfps
hasta = min(a.hasta, total)
n = int((hasta - a.desde) * a.fps)
m = Modelos(con_persona=True)
prev_conf = prev_gray = None
sm = lambda x, lo, hi: np.clip((x - lo) / (hi - lo), 0, 1) ** 2 * (3 - 2 * np.clip((x - lo) / (hi - lo), 0, 1)) if False else (lambda t: t * t * (3 - 2 * t))(np.clip((x - lo) / (hi - lo), 0, 1))
for i in range(n):
    t = a.desde + i / a.fps
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, fr = cap.read()
    if not ok: break
    rgba = cv2.cvtColor(fr, cv2.COLOR_BGR2RGBA)
    conf = m.persona(rgba)
    gray = cv2.GaussianBlur(cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.5)
    if prev_conf is not None:
        cambio = cv2.GaussianBlur(np.abs(gray - prev_gray), (0, 0), 3)
        w = np.clip(0.30 + cambio / 14.0, 0.30, 1.0)          # donde nada se mueve se promedia más
        conf = w * conf + (1 - w) * prev_conf
    prev_conf, prev_gray = conf.copy(), gray
    big = cv2.resize(conf, (a.ancho, a.alto), interpolation=cv2.INTER_CUBIC)
    big = cv2.GaussianBlur(big, (0, 0), 1.6)
    alpha = (sm(big, 0.42, 0.62) * 255).astype(np.uint8)
    cv2.imwrite(os.path.join(a.salida, f"{i:04d}.png"), alpha)
    if i % 100 == 0: print("máscara", i, "/", n, flush=True)
print("listo:", n, "cuadros")
