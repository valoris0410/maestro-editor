/* Efectos propios (catálogo de la guía 13): 10 Zoom digital · 9 Garabatos vivos · 2 Atraviesa la escena.
   Requiere GSAP 3 y, para las fuentes, el sistema de la guía 12 (tipografia.css). Lienzo 1080x1920, zona segura x 60-940, y 260-1480.
   Cada función agrega sus tweens a una línea de tiempo pausada `tl` (la que mueve el render con tl.time(t)) y devuelve el segundo en que termina.
   IMPORTANTE: llamarlas cuando las fuentes ya estén cargadas (await document.fonts.load(...)), porque miden texto.

   EP.zoomDigital(tl, { t, cara: {cx, cy, w, h}, objetivo: "#bg", pasos: [[aumento, desde, duración], ...] })
   EP.garabatos(tl, { t, cabeza: {cx, cy, r}, texto1: "mirá esto", texto2: "vos!", color: "#FFD23F" })
   EP.atraviesa(tl, { t, palabras: ["LA CÁMARA", "ATRAVIESA", "OBJETOS"], fondo: "#F4F1EA", texto: "#111", anillo: "#FFD23F" })
   Los datos de la cara salen de Herramientas\Tipografia\leer_toma.py (campo cara_caja del JSON). */
(function (global) {
  "use strict";
  var SVGNS = "http://www.w3.org/2000/svg";
  var Z = { x0: 60, y0: 260, x1: 940, y1: 1480 };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var q = function (s) { return typeof s === "string" ? document.querySelector(s) : s; };
  var uid = 0;

  function div(clase, padre, css, txt) {
    var d = document.createElement("div");
    if (clase) d.className = clase;
    if (css) d.style.cssText = css;
    if (txt) d.textContent = txt;
    padre.appendChild(d);
    return d;
  }
  function sv(tag, attrs, padre) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (padre) padre.appendChild(e);
    return e;
  }
  function rng(seed) {   // mulberry32: el mismo trazo "a mano" en cada render
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function snd(t, sfx, vol) { if (global.TIP && TIP.sonido) TIP.sonido(t, sfx, vol); }   // anota el efecto de sonido (mezclar-sfx.mjs)
  /* Funciones que se re-aplican en cada cuadro (el estado de un tween se pasa al DOM aquí). */
  function enganchar(tl, fn) {
    tl.__ep = tl.__ep || [];
    tl.__ep.push(fn);
    if (!tl.__epOn) {
      tl.__epOn = true;
      tl.eventCallback("onUpdate", function () { tl.__ep.forEach(function (f) { f(); }); });
    }
    fn();
  }

  /* ───────────────────────── 10 · ZOOM DIGITAL ─────────────────────────
     Marco de grabación (esquinas + REC), contador de aumento y un recuadro que sigue la cara mientras el video se acerca en escalones.
     Referencia: ×1,0 → ×1,3 → ×1,8 → ×2,6 en ~2,4 s. El zoom es alrededor de la cara, así que la cara no se mueve de lugar. */
  function zoomDigital(tl, o) {
    var op = Object.assign({
      stage: "#stage", objetivo: "#bg", t: 0,
      cara: { cx: 540, cy: 800, w: 260, h: 300 },
      pasos: [[1.3, 0.35, 0.28], [1.8, 1.05, 0.28], [2.6, 1.95, 0.16]],
      dur: 2.6, volver: 0.22
    }, o);
    var stage = q(op.stage), obj = q(op.objetivo), c = op.cara;
    var capa = div("ep-capa", stage, "opacity:0");
    function esq(izq, arr) {
      var x = izq ? Z.x0 : Z.x1 - 76, y = arr ? Z.y0 : Z.y1 - 76;
      div("ep-zd-esq", capa, "left:" + x + "px;top:" + y + "px;border-" + (arr ? "top" : "bottom") + ":7px solid #fff;border-" + (izq ? "left" : "right") + ":7px solid #fff");
    }
    esq(true, true); esq(false, true); esq(true, false); esq(false, false);
    var rec = div("ep-zd-rec", capa, "left:" + (Z.x0 + 30) + "px;top:" + (Z.y0 + 28) + "px");
    var punto = div("ep-zd-punto", rec);
    div("", rec, "", "REC");
    var cont = div("ep-zd-cont", capa, "right:" + (1080 - (Z.x1 - 30)) + "px;top:" + (Z.y0 + 28) + "px");
    var bw = c.w * 1.15, bh = c.h * 1.25;
    var caja = div("ep-zd-caja", capa, "left:" + (c.cx - bw / 2) + "px;top:" + (c.cy - bh / 2) + "px;width:" + bw + "px;height:" + bh + "px");
    var est = { s: 1 };
    obj.style.transformOrigin = c.cx + "px " + c.cy + "px";
    enganchar(tl, function () {
      obj.style.transform = "scale(" + est.s + ")";
      cont.textContent = "×" + est.s.toFixed(1).replace(".", ",");
      caja.style.transform = "scale(" + est.s + ")";
    });
    tl.fromTo(capa, { opacity: 0 }, { opacity: 1, duration: 0.12 }, op.t);
    tl.fromTo(obj, { filter: "brightness(1.35)" }, { filter: "brightness(1)", duration: 0.14 }, op.t);   // destello de "empieza a grabar"
    tl.fromTo(punto, { opacity: 1 }, { opacity: 0.15, duration: 0.01, repeat: 5, repeatDelay: 0.49, yoyo: true }, op.t);
    op.pasos.forEach(function (p) { tl.to(est, { s: p[0], duration: p[2], ease: "power3.out" }, op.t + p[1]); snd(op.t + p[1], "zoom-in"); });
    snd(op.t, "click");
    tl.to(est, { s: 1, duration: op.volver, ease: "power2.inOut" }, op.t + op.dur);
    tl.to(capa, { opacity: 0, duration: 0.12 }, op.t + op.dur);
    return op.t + op.dur + op.volver;
  }

  /* ───────────────────────── 9 · GARABATOS VIVOS ─────────────────────────
     Trazos a mano que se dibujan solos alrededor de la cabeza: texto + flecha, círculo, estrella con destellos, espiral, onda y una palabra final.
     Cada trazo lleva una capa oscura debajo (legibilidad sobre cualquier fondo, guía 12). Duración ≈ 3,4 s con escala 1. */
  function garabatos(tl, o) {
    var op = Object.assign({
      stage: "#stage", t: 0, escala: 1, semilla: 7, trazo: 9,
      cabeza: { cx: 540, cy: 760, r: 210 },
      texto1: "mirá esto", texto2: "vos!", color: "#FFD23F", tinta: "#FFFFFF", fuente: "Caveat"
    }, o);
    var stage = q(op.stage), R = rng(op.semilla), c = op.cabeza, r = c.r, T = function (x) { return op.t + x * op.escala; };
    var S = sv("svg", { viewBox: "0 0 1080 1920", width: 1080, height: 1920, class: "ep-capa" }, stage);
    var defs = sv("defs", {}, S);
    var ink = function (x, y) { return [clamp(x, Z.x0 + 10, Z.x1 + 70), clamp(y, Z.y0, Z.y1)]; };
    var L = function (pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" "); };

    function trazar(d, color, t, dur, ease, ancho) {
      var w = ancho || op.trazo, partes = [];
      [["rgba(0,0,0,.55)", w + 6], [color, w]].forEach(function (cw) {
        var p = sv("path", { d: d, fill: "none", stroke: cw[0], "stroke-width": cw[1], "stroke-linecap": "round", "stroke-linejoin": "round" }, S);
        var len = p.getTotalLength();
        p.style.strokeDasharray = len; p.style.strokeDashoffset = len; p.style.opacity = 0;
        tl.set(p, { opacity: 1 }, T(t));
        tl.to(p, { strokeDashoffset: 0, duration: dur * op.escala, ease: ease || "power1.inOut" }, T(t));
        partes.push(p);
      });
      return partes;
    }
    function escribir(texto, x, y, tam, rot, t, dur) {
      var id = "ep-cp-" + (++uid);
      var cp = sv("clipPath", { id: id }, defs), rect = sv("rect", { x: x - 20, y: y - tam, width: 0, height: tam * 1.5 }, cp);
      var g = sv("g", { "clip-path": "url(#" + id + ")", transform: "rotate(" + rot + " " + x + " " + y + ")" }, S);
      var mk = function (att) {
        var tx = sv("text", Object.assign({ x: x, y: y, "font-family": op.fuente, "font-weight": 700, "font-size": tam }, att), g);
        tx.textContent = texto; return tx;
      };
      mk({ fill: "none", stroke: "rgba(0,0,0,.6)", "stroke-width": 14, "stroke-linejoin": "round" });
      var top = mk({ fill: op.tinta });
      var ancho = top.getBBox().width + 40;
      tl.fromTo(rect, { attr: { width: 0 } }, { attr: { width: ancho }, duration: dur * op.escala, ease: "none" }, T(t));
      snd(T(t), "tap");
      return { x: x, y: y, ancho: ancho - 40 };
    }

    // 1) texto arriba a la izquierda de la cabeza + flecha curva hacia ella
    var p1 = ink(c.cx - 2.35 * r, c.cy - 2.15 * r), tamTxt = 100;
    var tx1 = escribir(op.texto1, p1[0], p1[1], tamTxt, -6, 0.2, 0.32);
    var sx = tx1.x + tx1.ancho * 0.5, sy = tx1.y + 28, ex = c.cx - 1.03 * r, ey = c.cy - 0.97 * r;
    var c1 = [sx - 60, sy + 100], c2 = [ex - 90, ey - 80];
    trazar("M" + sx + " " + sy + " C" + c1[0] + " " + c1[1] + " " + c2[0] + " " + c2[1] + " " + ex + " " + ey, op.tinta, 0.5, 0.42, "power2.inOut", 7);
    snd(T(0.5), "wosh-suave");
    var ang = Math.atan2(ey - c2[1], ex - c2[0]);
    trazar("M" + (ex - 40 * Math.cos(ang - 0.55)) + " " + (ey - 40 * Math.sin(ang - 0.55)) + " L" + ex + " " + ey + " L" + (ex - 40 * Math.cos(ang + 0.55)) + " " + (ey - 40 * Math.sin(ang + 0.55)), op.tinta, 0.9, 0.12, "none", 7);

    // 2) círculo alrededor de la cabeza (más de una vuelta, como dibujado a mano)
    var pts = [], vueltas = 1.14, n = 84, a0 = -1.9, ph = R() * 6.28;
    for (var i = 0; i <= n; i++) {
      var f = i / n, an = a0 + f * vueltas * 6.2832, k = 1 + 0.04 * f + 0.02 * Math.sin(an * 2 + ph) + (R() - 0.5) * 0.012;
      pts.push([c.cx + 1.28 * r * k * Math.cos(an), c.cy - 0.05 * r + 1.42 * r * k * Math.sin(an)]);
    }
    trazar(L(pts), op.color, 1.05, 0.62, "power1.inOut", op.trazo + 2);

    // 3) estrella arriba a la derecha + destellos
    var sp = ink(c.cx + 1.85 * r, c.cy - 1.5 * r), sr = 0.34 * r, e = [];
    for (var j = 0; j <= 10; j++) {
      var aa = -Math.PI / 2 + (j % 10) * Math.PI / 5, rr = (j % 2 ? 0.42 : 1) * sr * (1 + (R() - 0.5) * 0.08);
      e.push([sp[0] + rr * Math.cos(aa), sp[1] + rr * Math.sin(aa)]);
    }
    trazar(L(e), op.tinta, 1.8, 0.36, "power1.inOut", 7);
    snd(T(1.8), "pop"); snd(T(2.15), "shine");
    [[-0.9, 0.12], [-0.55, 0.0], [-0.2, 0.2]].forEach(function (sa, idx) {
      var aa = sa[0] * Math.PI, d0 = sr * (1.45 + sa[1]), d1 = sr * (1.95 + sa[1]);
      trazar("M" + (sp[0] + d0 * Math.cos(aa)) + " " + (sp[1] + d0 * Math.sin(aa)) + " L" + (sp[0] + d1 * Math.cos(aa)) + " " + (sp[1] + d1 * Math.sin(aa)), op.tinta, 2.15 + idx * 0.05, 0.1, "none", 7);
    });

    // 4) espiral abajo a la izquierda
    var spc = ink(c.cx - 1.85 * r, c.cy + 1.15 * r), sps = [];
    for (var m = 0; m <= 70; m++) { var tt = m / 70, as = tt * 2.2 * 6.2832; sps.push([spc[0] + 0.3 * r * tt * Math.cos(as), spc[1] + 0.3 * r * tt * Math.sin(as)]); }
    trazar(L(sps), op.tinta, 2.3, 0.4, "power1.inOut", 7);

    // 5) onda + palabra final
    var wx = ink(c.cx - 1.9 * r, c.cy + 2.15 * r), wp = [], largo = 1.5 * r;
    for (var w = 0; w <= 46; w++) { var u = w / 46; wp.push([wx[0] + largo * u, wx[1] + 16 * Math.sin(u * 6.2832 * 3) + (R() - 0.5) * 3]); }
    trazar(L(wp), op.color, 2.55, 0.4, "power1.inOut", 8);
    escribir(op.texto2, wx[0] + largo + 24, wx[1] + 18, 110, -4, 2.9, 0.28);

    tl.to(S, { opacity: 0, duration: 0.15 * op.escala }, T(3.5));
    return T(3.65);
  }

  /* ───────────────────────── 2 · ATRAVIESA LA ESCENA ─────────────────────────
     Tipografía gigante: la cámara vuela por dentro de las palabras y entra por la "O" de la última, cuyo hueco muestra la escena siguiente
     (lo que haya debajo del efecto) y se agranda hasta ocuparlo todo. Es un separador entre ideas o una entrada a un tema. Duración ≈ 3,3 s. */
  function atraviesa(tl, o) {
    var op = Object.assign({
      stage: "#stage", t: 0, escala: 1,
      palabras: ["LA CÁMARA", "ATRAVIESA", "OBJETOS"],
      fondo: "#F4F1EA", texto: "#111111", anillo: "#FFD23F", ancho: 860, fuente: "Anton, sans-serif", tam: 300
    }, o);
    var stage = q(op.stage), T = function (x) { return op.t + x * op.escala; };
    var raiz = div("ep-capa", stage, "display:block");   // visible mientras se mide; se oculta más abajo
    var a = div("", raiz, "position:absolute;left:0;top:0;width:1080px;height:1920px;background:" + op.fondo);
    var mundo = div("", a, "position:absolute;left:0;top:0;width:1080px;height:1920px");
    var ultimo = op.palabras.length - 1, ring = null, ws = [];
    op.palabras.forEach(function (pal, i) {
      var w = div("", mundo, "position:absolute;left:0;top:50%;width:1080px;text-align:center;white-space:nowrap;line-height:1;text-transform:uppercase;color:" + op.texto + ";font-family:" + op.fuente + ";font-weight:400;font-size:" + op.tam + "px");
      if (i === ultimo) {   // la primera letra de la última palabra es el anillo (medidas en em: escalan con la fuente)
        ring = div("ep-at-anillo", w, "width:.8em;height:.8em;border:.15em solid " + op.anillo);
        var resto = document.createElement("span"); resto.textContent = pal.slice(1); w.appendChild(resto);
      } else { w.textContent = pal; }
      ws.push(w);
    });
    // ajustar cada palabra al ancho seguro (mide con la fuente ya cargada)
    ws.forEach(function (w) {
      var rg = document.createRange(); rg.selectNodeContents(w);
      w.style.fontSize = Math.min(op.tam, op.tam * op.ancho / Math.max(rg.getBoundingClientRect().width, 1)) + "px";
    });
    var wf = parseFloat(ws[ultimo].style.fontSize);
    ws.forEach(function (w) { gsap.set(w, { yPercent: -50, scale: 1, opacity: 1, transformOrigin: "50% 50%" }); });
    var rr = ring.getBoundingClientRect(), st = stage.getBoundingClientRect();
    var cx = rr.left - st.left + rr.width / 2, cy = rr.top - st.top + rr.height / 2, r0 = rr.width / 2 - wf * 0.15;
    raiz.style.display = "none";
    mundo.style.transformOrigin = cx + "px " + cy + "px";
    var est = { k: 1 }, w3 = ws[ultimo];
    // el hueco de la máscara es el interior del anillo: se lee su posición y tamaño reales en cada cuadro
    // (diámetro exterior .8em, borde .15em → el radio interior es 0,625 del exterior)
    enganchar(tl, function () {
      mundo.style.transform = "scale(" + est.k + ")";
      if (raiz.style.display === "none") return;
      var rc = ring.getBoundingClientRect(), s0 = stage.getBoundingClientRect();
      var rad = 0.625 * rc.width / 2 * Number(gsap.getProperty(w3, "opacity"));
      var m = "radial-gradient(circle at " + (rc.left - s0.left + rc.width / 2) + "px " + (rc.top - s0.top + rc.height / 2) + "px, transparent " + rad + "px, #000 " + (rad + 0.6) + "px)";
      a.style.webkitMaskImage = m; a.style.maskImage = m;
    });
    tl.set(raiz, { display: "block" }, T(0));
    // palabras: entran pequeñas, se quedan un instante y pasan volando junto a la cámara
    var vuelos = [[0.0, 0.28, 0.55, 0.85], [0.5, 0.8, 1.1, 1.4]];
    ws.forEach(function (w, i) {
      if (i === ultimo) {
        tl.fromTo(w, { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 * op.escala, ease: "power2.out" }, T(1.05));
      } else {
        var v = vuelos[i] || [i * 0.55, i * 0.55 + 0.3, i * 0.55 + 0.6, i * 0.55 + 0.9];
        tl.fromTo(w, { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: (v[1] - v[0]) * op.escala, ease: "power2.out" }, T(v[0]));
        tl.to(w, { scale: 5, opacity: 0, duration: (v[3] - v[2]) * op.escala, ease: "power2.in" }, T(v[2]));
        snd(T(v[2]), "whoosh");
      }
    });
    // la cámara entra por el anillo: el hueco muestra la escena siguiente y todo crece hasta salir del cuadro
    tl.to(est, { k: 34, duration: 0.85 * op.escala, ease: "power3.in" }, T(1.95));
    snd(T(1.95), "zoom-in"); snd(T(2.6), "impacto", 0.12);
    tl.set(raiz, { display: "none" }, T(2.85));
    return T(3.3);
  }

  global.EP = { zoomDigital: zoomDigital, garabatos: garabatos, atraviesa: atraviesa };
})(window);
