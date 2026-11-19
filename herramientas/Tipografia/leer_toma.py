#!/usr/bin/env python3
"""Lee la toma de una imagen o video y recomienda dónde y cómo poner texto (guía 12, sección 4).

Uso (con el Python del skill /efectos, que ya trae MediaPipe, OpenCV y ffmpeg):
  "%USERPROFILE%\\.claude\\skills\\efectos\\.venv\\Scripts\\python.exe" leer_toma.py ARCHIVO [--n 8] [--paleta "#FFD23F,#FF3B5C"] [--region x,y,w,h] [--salida CARPETA]

Todo se evalúa sobre un lienzo de 1080x1920 (el video se escala para llenarlo, como en la edición).
Los umbrales son heurísticas [H] calibradas con mis pruebas visuales: sirven para decidir rápido, no son una ley.
"""
import argparse, json, math, os, subprocess, sys
os.environ.setdefault("GLOG_minloglevel", "2")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
import numpy as np
import cv2

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

W, H = 1080, 1920
SAFE = (60, 260, 940, 1480)  # x0, y0, x1, y1: zona segura de Reels
BANDA_W, BANDA_H = 880, 200  # dos líneas de 76 px + aire
MODELOS = os.path.join(os.path.expanduser("~"), ".claude", "skills", "efectos", "modelos")
PALETA = ["#FFD23F", "#FF3B5C", "#3D8BFF", "#00F2FE", "#FF2E7E", "#10B981"]
BUF = 1 << 30


def run(cmd):
    return subprocess.run(cmd, capture_output=True)


def duracion(ruta):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ruta])
    try:
        return float(r.stdout.decode().strip())
    except ValueError:
        return 0.0


def cuadro(ruta, t):
    vf = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}"
    salto = ["-ss", f"{t:.3f}"] if t > 0 else []  # con imágenes, -ss 0 no devuelve cuadros
    r = run(["ffmpeg", "-nostdin", "-v", "error", *salto, "-i", ruta, "-frames:v", "1", "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"])
    b = np.frombuffer(r.stdout, np.uint8)
    return b.reshape(H, W, 3) if b.size == W * H * 3 else None


def energia(ruta, dur):
    """Diferencia media entre cuadros a 30 fps (misma medida que analizar.mjs). Mediana del video."""
    r = run(["ffmpeg", "-v", "error", "-i", ruta, "-t", str(min(dur, 60)), "-vf", "fps=30,scale=64:114,format=gray", "-f", "rawvideo", "-"])
    b = np.frombuffer(r.stdout, np.uint8)
    n = b.size // (64 * 114)
    if n < 3:
        return None
    f = b[: n * 64 * 114].reshape(n, -1).astype(np.float32)
    return float(np.median(np.abs(np.diff(f, axis=0)).mean(axis=1)))


def luminancia(rgb):
    c = rgb.astype(np.float32) / 255.0
    c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]


def region(L, x, y, w, h):
    r = L[max(0, y): y + h, max(0, x): x + w]
    return {
        "media": float(r.mean()),
        "textura": float(r.std()),
        "baja_blanco": float(((1.05 / (r + 0.05)) < 3).mean()),   # fracción de píxeles donde el texto blanco rinde < 3:1
        "baja_negro": float((((r + 0.05) / 0.05) < 3).mean()),    # idem con texto negro
    }


def tratamiento(baja_blanco, textura):
    if baja_blanco < 0.03 and textura < 0.18:
        return "sombra"
    if textura < 0.30:  # el trazo funcionó en todos mis fondos probados (hasta textura 0.25); la caja queda como respaldo sin probar
        return "trazo+sombra"
    return "caja 55-60 % (o mover el texto)"


def p90(v):
    return float(np.percentile(v, 90))


def hex_a_hue(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i: i + 2], 16) for i in (0, 2, 4))
    return cv2.cvtColor(np.uint8([[[b, g, r]]]), cv2.COLOR_BGR2HSV)[0, 0, 0] * 2.0


def hues_dominantes(rgb):
    peq = cv2.resize(rgb, (96, 170), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(cv2.cvtColor(peq, cv2.COLOR_RGB2BGR), cv2.COLOR_BGR2HSV)
    m = (hsv[..., 1] > 60) & (hsv[..., 2] > 50)
    if m.sum() < 60:
        return []
    hist = np.bincount((hsv[..., 0][m] * 2 // 10).astype(int), minlength=36).astype(float)
    hist /= hist.sum()
    return [(i * 10 + 5, float(p)) for i, p in enumerate(hist) if p > 0.08]


def color_acento(frames, paleta):
    dom = {}
    for f in frames:
        for hue, p in hues_dominantes(f):
            dom[hue] = dom.get(hue, 0) + p / len(frames)
    if not dom:
        return [(c, 180.0) for c in paleta]
    puntaje = []
    for c in paleta:
        hc = hex_a_hue(c)
        dmin = min(min(abs(hc - h), 360 - abs(hc - h)) for h in dom)
        puntaje.append((c, float(dmin)))
    return sorted(puntaje, key=lambda x: -x[1])


def crear_modelos():
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision
    seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
        base_options=BaseOptions(model_asset_path=os.path.join(MODELOS, "selfie_segmenter.tflite")),
        running_mode=vision.RunningMode.IMAGE, output_confidence_masks=True, output_category_mask=False))
    det = vision.FaceDetector.create_from_options(vision.FaceDetectorOptions(
        base_options=BaseOptions(model_asset_path=os.path.join(MODELOS, "blaze_face_short_range.tflite")),
        running_mode=vision.RunningMode.IMAGE, min_detection_confidence=0.5))
    return mp, seg, det


def persona_y_caras(mp, seg, det, rgb):
    rgba = np.ascontiguousarray(np.dstack([rgb, np.full((H, W), 255, np.uint8)]))
    img = mp.Image(image_format=mp.ImageFormat.SRGBA, data=rgba)
    m = seg.segment(img).confidence_masks[0].numpy_view()
    m = np.array(m.reshape(m.shape[0], m.shape[1]), np.float32)
    filas = np.where((m > 0.5).sum(axis=1) > 20)[0]
    cabeza = int(filas[0]) if filas.size else None
    cobertura = float((m > 0.5).mean())
    caras = []
    for d in det.detect(img).detections:
        b = d.bounding_box
        caras.append((int(b.origin_x), int(b.origin_y), int(b.width), int(b.height)))
    if not caras and cabeza is not None:
        # el modelo de cara es de corto alcance: con caras chicas hay que ampliar la zona de la cabeza
        mb = m > 0.5
        filas_p = np.where(mb.sum(axis=1) > 20)[0]
        alto_p = int(filas_p[-1] - filas_p[0]) if filas_p.size else 0
        y0, y1 = max(0, cabeza - 10), min(H, cabeza + max(260, int(0.30 * alto_p)))
        cols = np.where(mb[y0:y1].any(axis=0))[0]
        if cols.size:
            xa, xb = max(0, int(cols[0]) - 40), min(W, int(cols[-1]) + 40)
            recorte = np.ascontiguousarray(rgba[y0:y1, xa:xb])
            esc = 640.0 / max(recorte.shape[:2])
            grande = np.ascontiguousarray(cv2.resize(recorte, None, fx=esc, fy=esc, interpolation=cv2.INTER_CUBIC))
            r2 = det.detect(mp.Image(image_format=mp.ImageFormat.SRGBA, data=grande)).detections
            for d in r2:
                b = d.bounding_box
                caras.append((int(xa + b.origin_x / esc), int(y0 + b.origin_y / esc), int(b.width / esc), int(b.height / esc)))
    caras.sort(key=lambda c: -c[2] * c[3])
    return cabeza, cobertura, caras[0] if caras else None


def escala_plano(fh_rel):
    if fh_rel is None:
        return "sin cara (voz en off, b-roll o plano muy ancho)"
    if fh_rel > 0.25:
        return "primer plano"
    if fh_rel > 0.12:
        return "plano medio corto"
    if fh_rel > 0.06:
        return "plano medio"
    return "plano entero o ancho"


def etiqueta_energia(e):
    if e is None:
        return "sin dato (imagen fija)"
    return "baja" if e < 0.8 else ("media" if e < 2.0 else "alta")


def dibujar(rgb, caras, cabeza, bandas, elegida, ruta):
    img = cv2.cvtColor(rgb.copy(), cv2.COLOR_RGB2BGR)
    cv2.rectangle(img, (SAFE[0], SAFE[1]), (SAFE[2], SAFE[3]), (255, 255, 255), 2)
    for (x, y, w, h) in caras:
        cv2.rectangle(img, (x, y), (x + w, y + h), (0, 220, 0), 4)
    if cabeza is not None:
        cv2.line(img, (0, cabeza), (W, cabeza), (0, 200, 255), 3)
    col = {"sombra": (0, 200, 0), "trazo+sombra": (0, 220, 255), "caja": (0, 0, 255)}
    for b in bandas:
        c = col["sombra"] if b["tratamiento"] == "sombra" else (col["trazo+sombra"] if b["tratamiento"].startswith("trazo") else col["caja"])
        t = 10 if b["nombre"] == elegida else 3
        cv2.rectangle(img, (b["x"], b["y"]), (b["x"] + BANDA_W, b["y"] + BANDA_H), c, t)
        cv2.putText(img, f'{b["nombre"]}: {b["tratamiento"]}', (b["x"] + 10, b["y"] + 36), cv2.FONT_HERSHEY_SIMPLEX, 1.0, c, 3)
    cv2.imwrite(ruta, cv2.resize(img, (540, 960), interpolation=cv2.INTER_AREA))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("archivo")
    ap.add_argument("--n", type=int, default=8, help="cuadros a muestrear en un video")
    ap.add_argument("--paleta", default=",".join(PALETA))
    ap.add_argument("--region", help="x,y,w,h: evaluar solo esa caja de texto (en el lienzo de 1080x1920)")
    ap.add_argument("--salida", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "salida"))
    a = ap.parse_args()
    ruta = os.path.abspath(a.archivo)
    os.makedirs(a.salida, exist_ok=True)
    nombre = os.path.splitext(os.path.basename(ruta))[0][:40]
    dur = duracion(ruta)
    es_video = dur > 0.5 and not ruta.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
    tiempos = [dur * (i + 0.5) / a.n for i in range(a.n)] if es_video else [0.0]
    frames = [f for f in (cuadro(ruta, t) for t in tiempos) if f is not None]
    if not frames:
        sys.exit("No pude leer cuadros del archivo.")
    mp, seg, det = crear_modelos()
    info = [persona_y_caras(mp, seg, det, f) for f in frames]
    Ls = [luminancia(f) for f in frames]
    cabezas = [i[0] for i in info if i[0] is not None]
    caras = [i[2] for i in info if i[2] is not None]
    cobertura = float(np.mean([i[1] for i in info]))
    res = {"archivo": os.path.basename(ruta), "cuadros_leidos": len(frames), "duracion_s": round(dur, 2)}

    # --- Modo región: evaluar una caja de texto concreta
    if a.region:
        x, y, w, h = (int(v) for v in a.region.split(","))
        st = [region(L, x, y, w, h) for L in Ls]
        bw, tx, bn = p90([s["baja_blanco"] for s in st]), p90([s["textura"] for s in st]), p90([s["baja_negro"] for s in st])
        res["region"] = {"x": x, "y": y, "w": w, "h": h, "peor_baja_blanco": round(bw, 3), "peor_textura": round(tx, 3),
                         "tratamiento": tratamiento(bw, tx),
                         "nota": "texto casi todo sobre fondo claro: probar también texto oscuro con trazo claro" if bw > 0.85 and bn < 0.1 else ""}
        print(json.dumps(res, ensure_ascii=False, indent=1))
        return

    # --- Lectura de la toma
    fh_rel = float(np.median([c[3] for c in caras]) / H) if caras else None
    cabeza_min = min(cabezas) if cabezas else None
    cara_base = float(np.median([c[1] + c[3] for c in caras])) if caras else None
    por_cuadro = [i[2] for i in info]
    cara_h = float(np.median([c[3] for c in caras])) if caras else None
    libre_arriba = (cabeza_min - SAFE[1]) if cabeza_min is not None else (SAFE[3] - SAFE[1])
    e = energia(ruta, dur) if es_video else None
    L_media = float(np.mean([L.mean() for L in Ls]))
    # --- Bandas candidatas para la VOZ (subtítulo de 2 líneas)
    cand = []
    x0 = (W - BANDA_W) // 2
    if cara_base is not None:
        cand.append(("pecho", int(min(cara_base + 0.35 * cara_h, SAFE[3] - BANDA_H))))
    else:
        cand.append(("centro-bajo", 1130))
    cand.append(("abajo", SAFE[3] - BANDA_H - 20))
    bandas = []
    for banda_nombre, y in cand:
        con_cara = [c for c in por_cuadro if c]
        choques = sum(1 for c in con_cara if not (x0 + BANDA_W < c[0] - 50 or x0 > c[0] + c[2] + 50 or y + BANDA_H < c[1] - 60 or y > c[1] + c[3] + 20))
        pisa_cara = bool(con_cara) and choques / len(con_cara) > 0.15  # la banda tapa la cara en más del 15 % de los cuadros
        pisa_cabeza = False
        st = [region(L, x0, y, BANDA_W, BANDA_H) for L in Ls]
        bw, tx, bn = p90([s["baja_blanco"] for s in st]), p90([s["textura"] for s in st]), p90([s["baja_negro"] for s in st])
        bandas.append({"nombre": banda_nombre, "x": x0, "y": y, "libre": not (pisa_cara or pisa_cabeza), "peor_baja_blanco": round(bw, 3),
                       "peor_textura": round(tx, 3), "tratamiento": tratamiento(bw, tx),
                       "texto_oscuro_posible": bool(bw > 0.85 and bn < 0.1)})
    rango = lambda b: 0 if b["tratamiento"] == "sombra" else (1 if b["tratamiento"].startswith("trazo") else 2)
    validas = [b for b in bandas if b["libre"]] or bandas
    mejor = min(validas, key=lambda b: (rango(b), b["peor_baja_blanco"] + 0.5 * b["peor_textura"]))
    pecho = next((b for b in validas if b["nombre"] in ("pecho", "centro-bajo")), None)
    if pecho and rango(pecho) == rango(mejor):
        mejor = pecho  # por convención, a la altura del cuello o pecho si el tratamiento necesario es el mismo
    if libre_arriba < 170:
        hook = "NO cabe arriba: pasar al torso, al costado o detrás de la persona (/efectos palabra-detrás)"
    else:
        resto = int(libre_arriba - 20 - 130)  # espacio que queda tras una línea de GOLPE de 112 px (130 con aire) y 20 px de margen
        hook = ("arriba: GOLPE de 2 líneas de 108 px, o GOLPE de 1 línea" if libre_arriba >= 300 else "arriba: GOLPE de 1 línea de 108 px")
        if resto >= 100:
            hook += f" + ACENTO de hasta {min(resto, 210)} px debajo"
    zona_hook = None
    if libre_arriba >= 170:
        alto_h = int(min(libre_arriba - 20, 320))
        st = [region(L, x0, SAFE[1], BANDA_W, alto_h) for L in Ls]
        bw, tx = p90([q["baja_blanco"] for q in st]), p90([q["textura"] for q in st])
        zona_hook = {"y": SAFE[1], "alto": alto_h, "peor_baja_blanco": round(bw, 3), "peor_textura": round(tx, 3), "tratamiento": tratamiento(bw, tx)}
    acento = color_acento(frames, [c.strip() for c in a.paleta.split(",") if c.strip()])
    res.update({
        "escala_plano": escala_plano(fh_rel),
        "cara_alto_rel": round(fh_rel, 3) if fh_rel else None,
        "cara_caja": ({k: int(np.median([c[i] for c in caras])) for i, k in enumerate(("x", "y", "w", "h"))} if caras else None),
        "caras_detectadas": f"{len(caras)} de {len(frames)} cuadros",
        "cabeza_mas_alta_y": cabeza_min,
        "libre_sobre_cabeza_px": int(libre_arriba),
        "persona_cobertura": round(cobertura, 2),
        "luminosidad_media": round(L_media, 2),
        "energia": etiqueta_energia(e),
        "energia_valor": round(e, 2) if e is not None else None,
        "hook_GOLPE": hook,
        "zona_hook": zona_hook,
        "bandas_VOZ": bandas,
        "banda_VOZ_recomendada": mejor["nombre"],
        "tratamiento_recomendado": mejor["tratamiento"],
        "colores_acento_sugeridos": [{"color": c, "distancia_de_tono_con_la_escena": round(d)} for c, d in acento[:3]],
        "revisar_a_mano": "manos, objetos y gestos que no detecto: mirar los cuadros más complejos antes de entregar",
    })
    # imagen anotada sobre el cuadro con la cabeza más alta
    idx = int(np.argmin([i[0] if i[0] is not None else 9999 for i in info])) if cabezas else 0
    png = os.path.join(a.salida, f"lectura-{nombre}.png")
    dibujar(frames[idx], [c for c in caras[:1]] if caras else [], cabeza_min, bandas, mejor["nombre"], png)
    with open(os.path.join(a.salida, f"lectura-{nombre}.json"), "w", encoding="utf-8") as fh:
        json.dump(res, fh, ensure_ascii=False, indent=1)
    print(f"Lectura de la toma: {res['archivo']}")
    print(f"- Plano: {res['escala_plano']} (cara = {res['cara_alto_rel']} del alto) · caras en {res['caras_detectadas']}")
    if res["cara_caja"]:
        cc = res["cara_caja"]
        print(f"- Cara: centro ({cc['x'] + cc['w'] // 2}, {cc['y'] + cc['h'] // 2}) · {cc['w']}×{cc['h']} px")
    print(f"- Espacio libre sobre la cabeza: {res['libre_sobre_cabeza_px']} px → hook GOLPE: {hook}")
    print(f"- Luminosidad media {res['luminosidad_media']} · energía {res['energia']}")
    if zona_hook:
        print(f"- Zona del hook (y {zona_hook['y']}, {zona_hook['alto']} px): peor caso baja-contraste {zona_hook['peor_baja_blanco']:.0%} · textura {zona_hook['peor_textura']:.2f} → {zona_hook['tratamiento']}")
    for b in bandas:
        print(f"- Banda {b['nombre']} (y {b['y']}): {'libre' if b['libre'] else 'PISA CARA'} · peor caso baja-contraste {b['peor_baja_blanco']:.0%} · textura {b['peor_textura']:.2f} → {b['tratamiento']}"
              + (" · (probar texto oscuro)" if b["texto_oscuro_posible"] else ""))
    print(f"→ VOZ: banda {mejor['nombre']} con {mejor['tratamiento']}")
    print("→ Colores de acento (más lejos del tono de la escena): " + ", ".join(f"{c} ({round(d)}°)" for c, d in acento[:3]))
    print(f"Imagen: {png}")


if __name__ == "__main__":
    main()
