/* Entradas y salidas de texto (guía 12, sección 7). Requiere GSAP 3 cargado antes (global `gsap`).
   Se agregan a una línea de tiempo pausada `tl` (la misma que HyperFrames o un render por cuadros mueven con tl.time(t)).

   TIP.entrada(tl, "#hook", "golpe", 0.4)           → el elemento entra con el preset en el segundo 0.4
   TIP.salida(tl, "#hook", "rapida", 3.3)           → sale en 0.1 s
   TIP.palabras(tl, "#sub1", [0.4, 0.7, 0.9, 1.1], {modo: "ilumina"})   → cada palabra se enciende cuando se dice
   TIP.cuenta(tl, "#cifra", 50, 1.0, {dur: .8})     → contador de 0 a N
   TIP.permanencia("tu cabeza ya no alcanzaba")     → segundos mínimos en pantalla (>=0,83 s y ~18 caracteres/s)

   Presets por emoción (duraciones medidas en las referencias de la guía 09: entradas de 0,10 a 0,30 s):
   golpe (curiosidad, impacto) · estampa (urgencia, cifra) · suave (autoridad, sin rebote) · rebote (humor) · fundido (intimidad, aspiración)
   · escribe (barrido de izquierda a derecha, claridad) · corte (dolor, seco) */
(function (global) {
  const PRESETS = {
    golpe:   { desde: { opacity: 0, scale: 1.35, filter: "blur(10px)" }, a: { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.18, ease: "power4.out" } },
    estampa: { desde: { opacity: 0, scale: 2.2 },                        a: { opacity: 1, scale: 1, duration: 0.14, ease: "power4.in" } },
    suave:   { desde: { opacity: 0, y: 24 },                              a: { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" } },
    rebote:  { desde: { opacity: 0, scale: 0.6, rotation: -6 },           a: { opacity: 1, scale: 1, rotation: 0, duration: 0.28, ease: "back.out(2.2)" } },
    fundido: { desde: { opacity: 0 },                                     a: { opacity: 1, duration: 0.55, ease: "sine.inOut" } },
    escribe: { desde: { opacity: 1, clipPath: "inset(0 100% 0 0)" },      a: { clipPath: "inset(0 0% 0 0)", duration: 0.4, ease: "power2.inOut" } },
    corte:   { desde: { opacity: 0 },                                     a: { opacity: 1, duration: 0.001 } },
  };
  const SALIDAS = {
    rapida: { a: { opacity: 0, duration: 0.1, ease: "power1.in" } },
    sube:   { a: { opacity: 0, y: -20, duration: 0.15, ease: "power2.in" } },
    lenta:  { a: { opacity: 0, duration: 0.5, ease: "sine.inOut" } },
  };

  /* Sonido: cada animación anota en TIP.eventos qué efecto le corresponde y en qué segundo ({t, sfx, vol?}).
     El render (Efectos propios\render-proyecto.mjs) guarda esa lista en salida/sfx.json y Herramientas\Efectos de sonido\mezclar-sfx.mjs la mezcla.
     Mapa por defecto = Herramientas\Efectos de sonido\mapa-sfx.json (guía 14): golpe/estampa → impacto, suave → wosh-suave, rebote → pop, escribe → tap.
     Se apaga con {sonido: false} o se cambia con {sonido: "whoosh", vol: 0.12} en el último argumento de entrada(). */
  const SONIDO_DE = { golpe: "impacto", estampa: "impacto", suave: "wosh-suave", rebote: "pop", escribe: "tap", fundido: null, corte: null };
  const eventos = [];
  function sonido(t, sfx, vol) { if (sfx) eventos.push({ t: t, sfx: sfx, vol: vol }); }

  function entrada(tl, sel, nombre, t, extra) {
    const p = PRESETS[nombre];
    if (!p) throw new Error("preset de entrada desconocido: " + nombre);
    const ex = Object.assign({}, extra || {});
    const snd = ex.sonido, vol = ex.vol; delete ex.sonido; delete ex.vol;   // no son propiedades de GSAP
    tl.fromTo(sel, Object.assign({}, p.desde), Object.assign({}, p.a, ex), t);
    if (snd !== false) sonido(t, typeof snd === "string" ? snd : SONIDO_DE[nombre], vol);
    return tl;
  }
  function salida(tl, sel, nombre, t, extra) {
    const p = SALIDAS[nombre || "rapida"];
    if (!p) throw new Error("salida desconocida: " + nombre);
    tl.to(sel, Object.assign({}, p.a, extra || {}), t);
    return tl;
  }
  /* Parte el texto de `sel` en palabras (<span class="w">) y las enciende en los tiempos dados (uno por palabra). */
  function palabras(tl, sel, tiempos, opts) {
    const o = Object.assign({ modo: "ilumina", apagada: 0.35 }, opts || {});
    const el = document.querySelector(sel);
    const nodos = [];
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (parte) {
          if (!parte) return;
          if (/^\s+$/.test(parte)) { nodos.push(document.createTextNode(parte)); return; }
          const s = document.createElement("span"); s.className = "w"; s.textContent = parte; nodos.push(s);
        });
      } else { if (n.nodeName !== "BR" && n.classList) n.classList.add("w"); nodos.push(n); }
    });
    el.textContent = ""; nodos.forEach(function (n) { el.appendChild(n); });
    const ws = el.querySelectorAll(".w");
    ws.forEach(function (w, i) {
      const t = tiempos[Math.min(i, tiempos.length - 1)];
      if (o.modo === "aparece") tl.fromTo(w, { opacity: 0 }, { opacity: 1, duration: 0.05 }, t);
      else tl.fromTo(w, { opacity: o.apagada }, { opacity: 1, duration: 0.06 }, t);
    });
    return tl;
  }
  function cuenta(tl, sel, valor, t, opts) {
    const o = Object.assign({ dur: 0.8, ease: "power2.out" }, opts || {});
    const el = document.querySelector(sel); const obj = { v: 0 };
    el.textContent = "0";
    tl.to(obj, { v: valor, duration: o.dur, ease: o.ease, onUpdate: function () { el.textContent = Math.round(obj.v).toLocaleString("es-AR"); } }, t);
    if (o.sonido !== false) sonido(t, "contador");
    return tl;
  }
  function permanencia(texto) { return Math.max(0.83, texto.length / 18); }

  global.TIP = { PRESETS: PRESETS, SALIDAS: SALIDAS, SONIDO_DE: SONIDO_DE, eventos: eventos, sonido: sonido, entrada: entrada, salida: salida, palabras: palabras, cuenta: cuenta, permanencia: permanencia };
})(window);
