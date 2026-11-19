# Maestro Editor — manual completo del agente de edición de video y diseño gráfico

Versión 1.0 · 10-11-2026 · creado por Valentín Gómez (Value Labs) con Claude Code.

Este documento contiene todo el conocimiento del agente "Maestro Editor": cómo piensa, cómo edita, qué reglas sigue, qué herramientas usa y qué errores ya aprendió a evitar.
Sirve para dos cosas:
1. **Leerlo** y entender el método de edición.
2. **Instalar el agente** en tu propio Claude Code. Los pasos están en `INSTALAR.md`, en esta misma carpeta.

Niveles de certeza que vas a ver: **[E]** respaldado por estudio o estándar · **[P]** práctica de la industria · **[H]** hipótesis probada en cuadros reales pero todavía sin métricas.

---

## Índice
1. Cómo funciona el agente
2. Principios de dirección y edición
3. Criterio por formato de video
4. Subtítulos: el sistema de 4 capas
5. Tipografía: roles, fuentes, combinación y lectura de la toma
6. Gatillo mental → tipografía
7. Animación de texto
8. Cámara, zooms, transiciones y movimiento
9. Efectos de sonido
10. Música
11. Audio de la voz
12. B-rolls
13. Catálogo de efectos
14. Diseño de carruseles y piezas gráficas
15. Flujo de trabajo completo, paso a paso
16. Control de calidad antes de entregar
17. Perfiles por creador
18. Herramientas del agente
19. Errores ya cometidos y cómo no repetirlos
20. Lo que todavía no está probado

---

## 1. Cómo funciona el agente

El agente tiene cuatro piezas:

| Pieza | Qué es | Dónde vive |
|---|---|---|
| **Skill `/editor`** | Las instrucciones que Claude carga cuando le pedís editar | `~/.claude/skills/editor/SKILL.md` |
| **Subagente `editor`** | Un Claude aparte al que otro chat le delega una edición completa | `~/.claude/agents/editor.md` |
| **Este manual + perfiles** | El conocimiento: reglas, criterios, estilo de cada creador | carpeta `Maestro-Editor\` |
| **Herramientas** | Scripts que hacen el trabajo: subtítulos, máscaras, sonido, CapCut | `Maestro-Editor\herramientas\` |

**Cómo se organiza el trabajo (recomendado):**
- Un chat "Maestro Editor" es el **cerebro**. Ahí se aprende, se corrigen reglas y se construyen herramientas.
- Cada marca o cliente tiene **su propio chat**, que es un **proyecto donde se edita**. Ese chat lee este manual y aplica lo aprendido.
- Lo que el editor aprende se escribe en este manual o en el perfil del creador, con fecha. Si queda solo en la memoria de un chat, los otros chats no lo ven.

**Principio de autoría:** el agente tiene criterio propio, pero **la marca y el creador mandan**. Nunca impone un estilo global. Primero lee el perfil del creador y los documentos de la marca.

---

## 2. Principios de dirección y edición

**Regla madre: la edición se adapta al mensaje, no el mensaje a la edición.** Calidad es pertinencia, no cantidad de efectos. Pensar como editor senior: cada recurso tiene una función.

### Procedimiento con cada video
1. **Análisis** del video completo: mensaje, intención, emoción, formato y momentos clave (hook, frases de impacto, palabras importantes, conceptos a visualizar, cambios de tema, pausas, remates, datos, conclusión).
2. **Plan editorial** en lenguaje simple: estilo, ritmo, subtítulos, gráficos, b-rolls, música, efectos. **Se muestra antes de renderizar a lo grande.**
3. **Ejecución**: se entrega el archivo, no una descripción.
4. **Revisión** completa contra el control de calidad (sección 16).
5. **Entrega**: 1080×1920, 9:16, lista para publicar, con copia liviana.

Formato no es intención: tres consejos pueden ser educativos, humorísticos o provocadores, y se editan distinto.

### Prohibido
Plantilla única · transiciones sin motivo · b-rolls sin relación · música sobre la voz · efectos fuertes · tapar la cara · texto bajo la interfaz de Instagram · textos largos · animaciones que dificulten leer · acelerar lo emocional · reflexivo hiperactivo · entretenimiento estático · repetir animaciones sin criterio · recursos de baja calidad · sacrificar comprensión por dinamismo · cambiar el significado · poner en subtítulos palabras que no se dijeron · decoración vacía · material sin derechos · **filtros sobre la persona** (ver abajo).

### Sin filtros sobre el video de la persona
El video a cámara se deja como viene: sin contraste, saturación, viñeta, brillo ni fondo desenfocado. Único gradeo permitido: blanco y negro (por ejemplo, en el momento de duda o de prueba). Los filtros van solo en los b-rolls superpuestos. Calidad: escalar una sola vez con lanczos, sin recompresiones sucesivas, CRF bajo.

### Zona segura de Instagram Reels (obligatoria)
Todo texto dentro de **x 60–940, y 260–1480** en 1080×1920. Arriba está la interfaz, abajo la descripción y a la derecha los íconos. Ninguna línea de más de 880 px: si se pasa, se achica sola.

### Cara siempre visible
De la frente a la pera, la cara nunca queda tapada. Tampoco la mano ni el micrófono cuando son parte del gesto. Si un texto no entra, se achica, se mueve o se hace un zoom out.

---

## 3. Criterio por formato de video

| Formato | Cómo se edita |
|---|---|
| **Talking head / yapping** | Limpia. Subtítulos como elemento principal, hook textual, cortes de silencios y errores, zooms suaves con motivo, destacados en frases clave, música discreta, b-roll solo si explica. La persona es el centro. |
| **Storytelling** | Narrativa visual: b-rolls de lo que pasa, contexto, música que evoluciona, efectos puntuales, silencios con significado. No acelerar lo emocional. |
| **Voz en off** | Secuencia visual constante; movimientos de cámara; planos generales, medios y primeros; textos y gráficos sincronizados con la narración. La tipografía puede ser protagonista. |
| **Educativo** | Información organizada: números, flechas, recuadros, mockups, demostraciones, pasos separados. Ágil sin perder comprensión. |
| **Reflexivo / filosófico** | Natural, emoción antes que efectos, imágenes con sentido, pausas, frases protagonistas, casi sin animaciones. |
| **Viral / entretenimiento** | Dinámico: cortes ágiles, zooms a reacciones, textos llamativos, efectos humorísticos, ritmo con los remates. |
| **VSL horizontal largo** | Subtítulos simples a la altura del plexo, con margen amplio a los costados. Frases clave con base sans bold y 1-2 palabras en cursiva superpuesta, con un mini zoom seco del 4 %. Variar 4 o 5 estilos de énfasis. Entre 1 y 2 motion graphics por minuto (listas, pasos, o para tapar cuando el locutor lee). Ningún b-roll más de 3 veces. |

**Cierres:** desaparición progresiva (reflexivo, emocional) · corte seco (humor, contundente) · música que baja (inspiracional) · impacto visual (dinámico) · cierre circular. Sin animaciones finales innecesarias.

---

## 4. Subtítulos: el sistema de 4 capas

> **Esta es la regla más importante del manual.** Un subtítulo plano (texto blanco con contorno negro fino, sin animación, una sola fuente) se ve anticuado y decepcionante. Fue la corrección más fuerte que recibió el agente. El sistema de 4 capas es el estándar aprobado.

### Las cuatro capas
**1. VOZ: subtítulo base o de relleno (va siempre)**
- Fuente **System** (la de Apple o la del sistema; en Windows, Segoe UI). Peso semibold o bold.
- Receta: **sombra negra** con opacidad 30 y desenfoque 70; **brillo blanco** con intensidad 30 e intervalo 20; **espaciado** de carácter -1 y de línea -1 (valores de CapCut).
- 2 a 4 palabras por línea (máximo 6), una sola línea, sin caja, **sin contorno duro**.
- Tamaño de referencia: 72-80 px en 1080×1920 (mínimo 56).
- **Entra palabra por palabra** cuando se dice: cada palabra aparece en 0,17 s, de desenfocada y un poco más chica a nítida.
- A la altura del cuello o del pecho, centrada sobre la persona. Nunca sobre la cara.
- Sobre ropa clara (camisa blanca) la sombra sola no alcanza: se refuerza la sombra (dos capas, una corta y oscura) en vez de poner un contorno grueso.

**2. GOLPE: palabra clave (1 cada 8-15 s)**
- El sustantivo, número o idea que hay que recordar. 1 a 3 palabras.
- Fuente condensada pesada en **MAYÚSCULAS** (Anton, Bebas Neue), **inclinada -8° a -10°**.
- **Gigante:** lo más grande que entre en el espacio libre (normalmente 150-250 px).
- Núcleo cálido (crema → color de acento en degradé) con **glow del mismo color de acento** en tres capas (cerca intenso, medio, lejano suave). El glow es el mismo color con menos opacidad y mucho desenfoque, nunca otro color.
- **Va detrás de la persona** cuando se puede: el pelo o el hombro tapan parte de las letras. Eso la integra a la escena. Se logra con una máscara de la persona cuadro por cuadro.
- Entra con escala 1,45 → 1 y desenfoque 16 px → 0 en 0,24 s, con ease-out fuerte.
- Si son varias palabras, la última va en el color de acento puro.

**3. TÍTULO condensado con brillo (hook, cambio de sección, promesa)**
- Igual que el GOLPE pero en 2-3 líneas apretadas (interlineado 0,9), con 2 colores en el bloque (la primera palabra clara, la segunda en acento).
- Casi siempre detrás de la persona, arriba de la cabeza.

**4. CURSIVA: acento emocional (1 cada 15-20 s)**
- Una palabra o frase corta y emocional en **manuscrita** (letra de mano, no itálica): de pincel enérgica (Sinethar, Dancing Script) o caligráfica fina para lo premium (Roundhand, Allura).
- **Neón:** núcleo amarillo-lima saturado con glow del color de acento.
- **Rotada** -8° a -12°, cruzando el título o en el espacio libre.
- Se revela de izquierda a derecha, como si se escribiera, en 0,35-0,4 s.
- **Nunca sobre los ojos ni las cejas.** Va sobre el pelo, la pared o el hombro.

### Reglas que cruzan las cuatro capas
- **Dupla tipográfica obligatoria:** sans de sistema (voz) + condensada pesada (golpe) + manuscrita (acento). Contraste de categoría, escala y peso.
- **Un solo color de acento por video, saturado al 100 %.** Todo lo demás en blanco, negro o gris. Nunca colores pálidos.
- **Si todo es clave, nada es clave.** 8-12 palabras clave por minuto como máximo.
- Las palabras clave **se sacan del subtítulo base** en ese momento: no se repite la misma palabra en dos capas a la vez.
- Sincronía con la voz de ±0,05 s, sin anticiparse. Cada texto queda al menos 0,83 s. Lectura de 17-20 caracteres por segundo [E/P: Netflix].
- **Nunca entregar subtítulos quemados con ffmpeg/ASS ni un SRT plano como resultado final.** Sirven solo de borrador interno.

### Recursos especiales
- **Pared de palabras:** la palabra urgente repetida en 6-9 renglones detrás de la persona, al 25-40 %, algunos solo en contorno. Bajan uno por uno (cada 0,05 s) y salen con un flash blanco. Una sola vez por video.
- **Pastilla:** caja de color con texto negro en mayúsculas en la línea de corte de una pantalla partida. Pastilla oscura translúcida (negro al 60-70 %) para títulos de sección.
- **Hook fijo:** caja redondeada oscura con 2 líneas en negrita (línea 1 en acento, línea 2 en blanco) en los primeros segundos.
- **Hook textual:** arriba, debajo del encabezado de Instagram. Breve, legible, despierta curiosidad, complementa el hook hablado. Si se dice "3 cosas", se muestra "1 2 3" en columna.

### Dónde va cada cosa según la toma
- Si hay ≥170 px libres sobre la cabeza: GOLPE y título arriba, detrás del pelo.
- Si la cabeza toca el borde superior: el GOLPE va al torso, al costado o detrás de la persona.
- En primer plano cerrado el espacio es poco: palabra clave de 1 línea.
- En plano medio o abierto: palabras clave más grandes y en 2-3 líneas.

---

## 5. Tipografía: roles, fuentes, combinación y lectura de la toma

### Qué se sabe
| Tema | Hallazgo | Certeza |
|---|---|---|
| Personalidad | Cada fuente transmite rasgos al instante (serif: formal; script: cercana; sans: neutra). Efecto modesto | [E] |
| Fluidez | Letra difícil de leer = la tarea parece más difícil | [E] Song y Schwarz 2008 |
| Legibilidad | Tamaño, contraste y peso pesan más que la cara de la fuente | [P] |
| En móvil | Ganan las fuentes pesadas; MAYÚSCULAS solo en frases cortas | [P] |
| Forma de la cara → fuente | **No hay evidencia.** Lo que condiciona es la toma | búsqueda sin resultados |

### Roles
| Rol | Función | Primera opción | Alternativas |
|---|---|---|---|
| **VOZ** | Subtítulo que acompaña el discurso (~60 % del texto) | System / Segoe UI | Inter 800, Montserrat 700/800, Poppins |
| **GOLPE** | Hook, impacto, cifra (~30 %) | Anton | Bebas Neue, Oswald 700, Archivo 900, Deutschlander (extra condensada) |
| **ACENTO** | 1-3 palabras en otra voz (~10 %) | Manuscrita de neón (Sinethar) | Instrument Serif cursiva, Playfair cursiva (autoridad), Dancing Script o Caveat (cercana), Roundhand (premium), Permanent Marker (cruda) |
| **DATO** | Cifras, etiquetas, interfaz | Space Grotesk 700 | JetBrains Mono, Inter con cifras tabulares |

### Reglas de combinación
1. Contraste de categoría (sans con cursiva o manuscrita), de escala (≥1,5× entre niveles: 76 → 120 → 200 px) y de peso. Dos fuentes casi iguales (Montserrat + Poppins) no suman: se ve un error.
2. Una sola decorativa por pieza.
3. Un solo elemento de acento a la vez.
4. La cursiva va 1,5-2,5× más grande que la voz porque su altura de letra es menor.
5. No para texto corrido: pixel (salvo estilo retro), cómic, firmas finas de menos de 150 px.

### Lo que mostraron las pruebas [H]
- Todas las fuentes probadas muestran bien ñ, tildes, ¿ y ¡.
- Playfair y Cormorant traen números "de texto" (el 50 parece 5o): para datos usar `lining-nums` u otra familia.
- Bebas Neue no tiene minúsculas: no sirve para frases largas.
- Nueve palabras en una línea son una pared: partir.
- Las fuentes finas se pierden sobre fondo claro.
- Anton a 108 px entra con 16 caracteres en 880 px.

### Lectura de la toma (antes de poner texto)
| Variable | Qué se mira | Qué se decide |
|---|---|---|
| Espacio libre | Zonas sin cara ni manos dentro de la zona segura | Dónde va cada rol |
| Luminancia detrás del texto | Claro, oscuro, mixto, ocupado | Oscuro: sombra. Claro o mixto: sombra reforzada. Muy ocupado: caja al 55-60 % o mover el texto. Glow sobre fondo oscuro o de color |
| Escala del plano | Primer plano, medio, entero, sin cara | Primer plano: textos cortos y condensados. Entero: más tamaño. Sin cara: la tipografía es protagonista (100-200 px) |
| Energía de la persona | Gestos y ritmo | Tranquila: serif, entradas lentas. Intensa: condensada pesada, entradas secas |
| Color de ropa y fondo | Qué colores hay en escena | Acento en un color que no esté en la escena |
| Voz de la marca | Seria, juvenil, rebelde | Peso y contraste (serio), redondo (cercano), angular (rebelde) |

La herramienta `leer_toma.py` mide todo esto automáticamente (sección 18).

### Tamaños de referencia (1080×1920)
VOZ 72-80 px · GOLPE 150-250 px · ACENTO 150-210 px · DATO 300-500 px con etiqueta de 38-44 px · etiquetas pequeñas ≥38-44 px y peso ≥500.

---

## 6. Gatillo mental → tipografía [H]

| Gatillo | Roles y fuentes | Color | Entrada |
|---|---|---|---|
| Curiosidad | GOLPE Anton + ACENTO cursiva en la palabra clave + VOZ | blanco + 1 acento cálido | golpe de 0,10-0,20 s en el hook |
| Dolor / miedo | GOLPE condensada sin adornos | rojo desaturado, blanco | corte seco, sin rebote |
| Urgencia / escasez | Píldora + cifra gigante + condensada | rojo + amarillo | 0,10-0,20 s, la cifra cae o se estampa |
| Autoridad | Serif con 1 palabra en cursiva + sans, filete fino | blanco + dorado | ease-out suave de 0,25 s, sin rebote, sin glow |
| Prueba social / datos | Cifra en Space Grotesk + etiqueta mono | blanco + 1 acento | contador de 0 a N en 0,6-1,0 s |
| Claridad / sistema | Mono + grotesca, listas que se marcan solas | 1 acento | de a un paso, con la voz |
| Identificación / humor | Sans redonda pesada en sticker + manuscrita | amarillo + blanco | rebote del 5-8 % |
| Provocación | Marker + condensada, tachado | rojo + blanco | golpe, trazo grueso |
| Intimidad / reflexión | Serif regular + cursiva, mucho aire | crema + acento suave | fundido de 0,4-0,7 s |
| Aspiración / deseo | Cursiva grande (1 palabra) + sans en mayúsculas | blanco sobre oscuro | lento, ease-in-out |

---

## 7. Animación de texto

- **Entradas de 0,10 a 0,30 s.** Salidas más rápidas (~0,10 s). Fundidos solo para emoción lenta.
- **Easing según emoción:** urgente o dolor = ease-out agresivo o corte; humor o golpe = rebote del 5-8 %; autoridad = ease-out suave sin rebote; intimidad = ease-in-out lento.
- **Sincronía:** la palabra aparece cuando se dice (±0,05 s).
- **Permanencia:** mínimo 0,83 s por texto.
- **Un solo movimiento a la vez.** La animación acompaña el significado: lo que "cae" cae, la cifra que "sube" sube.
- **Nunca la misma animación dos veces seguidas.**
- Los textos en pantalla no quedan clavados: el título se acerca o aleja 3-5 % mientras está.

| Preset | Cuándo | Duración y curva | Sonido |
|---|---|---|---|
| `golpe` | hook, impacto, curiosidad | 0,18 s, entra grande y desenfocado | impacto corto |
| `estampa` | cifra o urgencia | 0,14 s, cae desde 2,2× | impacto |
| `suave` | autoridad, explicación | 0,25 s, sube 24 px | whoosh suave |
| `rebote` | humor, identificación | 0,28 s, rebote 5-8 % | pop |
| `escribe` | claridad, tecleo | 0,4 s, barrido izquierda → derecha | tap |
| `fundido` | intimidad, aspiración | 0,55 s | ninguno |
| `corte` | dolor, seco | instantáneo | ninguno |
| `cuenta` | números que suben | 0,8 s | contador |
| letras salteadas | variante del acento | ~0,5 s, stagger aleatorio de 0,025 s | tap |

---

## 8. Cámara, zooms, transiciones y movimiento

### Ritmo de cámara
- **Corte o cambio de encuadre cada 2-4 s.** Nunca más de 5-6 s iguales.
- La cara en el tercio de arriba (ojos en y ≈ 600-750 de 1920). El encuadre sigue a la persona sin saltos.
- **Un movimiento distinto cada 2-4 s** (empuje → golpe → sacudida → barrido). Repetir el mismo seguido cansa.

### El movimiento que retiene
- **Empuje continuo:** escala de 100 % a 106-110 % a lo largo del plano, más una deriva de 10-25 px.
- **Microrotación:** ±0,5-1,5° en vaivén lento (2-3 s).
- **Golpe de zoom** en la palabra clave: 100 → 125-140 % en 0,12-0,2 s, con desenfoque de movimiento.
- **Sacudida** de 0,2-0,3 s (6-12 px, 2-3 oscilaciones) en los impactos.
- **Barridos** entre tomas: 200-400 px con desenfoque en 0,2 s, con whoosh.
- **Tarjetas en 3D:** capturas con perspectiva (rotateY 8-15°, rotateX 3-6°) que flotan 6-10 px.
- Zooms solo con intención: progresivo, rápido, out, suave, con impacto o reencuadre.

### Transiciones
- **Flash fotográfico** (destello breve + obturador bajo) como transición preferente cuando termina una idea y empieza otra. No después de cada oración.
- Flash blanco o sobreexposición de 0,2-0,3 s al cambiar de sección.
- Zoom de entrada con desenfoque entre dos tomas de la misma persona.
- Forma de color desenfocada que barre la pantalla.
- Por defecto, corte directo. Una transición solo si tiene función; una sola familia de transiciones por video.

### Cuando aparece una prueba
Fondo en blanco y negro y oscurecido, la tarjeta flotando al centro y un **óvalo blanco dibujado a mano** alrededor del dato.

### Gráficos
Entran con escala 0,6 → 1 y rebote suave. Los contadores suben, los checklists se completan, los íconos ganan un tilde. Stickers de formas (asteriscos, estrellas) en el color de acento, 1-2 por vez.

---

## 9. Efectos de sonido

### Principio
**Pocos, variados y bajos.** Solo en algunas palabras clave, nunca uno por cada animación. Sonidos **reales y grabados** (los sintéticos generados por código suenan artificiales y se rechazaron).

### Criterio para elegir cada sonido
Antes de poner un sonido, responder: ¿qué hace la imagen?, ¿hacia dónde se mueve?, ¿en qué cuadro termina?
1. **El sonido imita el movimiento, no la importancia.** Acercar → whoosh o zoom que **sube** de tono; alejar → que **baja**; algo que aparece → pop; texto que se escribe → tap o click; destello o cambio de idea → obturador; subida antes de una revelación → riser.
2. **El impacto es solo para algo que cae o golpea** (palabra GOLPE, cifra, estampa). **Nunca en un zoom, un barrido ni un texto suave.** (Error real: un impacto bajo un zoom fue rechazado.)
3. **El pico del sonido cae donde el movimiento termina de asentarse**, no donde empieza.
4. **Mezcla baja:** si un efecto se oye como efecto, está muy alto.
5. **Algunos estilos no llevan efectos** (voz limpia, música baja). El perfil del creador decide la densidad, que puede ser cero.
6. **Firma sonora:** pocos sonidos por creador y repetidos (el mismo pop, el mismo click).
7. Si dudás entre dos, el más corto y más suave, o ninguno.

### Volúmenes y cantidades
- Volumen como fracción del pico de la voz: 0,06 a 0,14 (0,10 ≈ 20 dB por debajo). Música aparte, 10-20 %.
- **Máximo 10 por minuto** [H]. Entre dos sonidos iguales, al menos 0,12 s. No repetir el mismo archivo seguido.
- **Silencio:** medio segundo sin sonido antes de la frase clave pega más que un efecto.

### Categorías
| Categoría | Para | Vol. | Buscar en Pixabay (inglés) |
|---|---|---|---|
| impacto | entrada fuerte de palabra o cifra | 0,14 | cinematic hit impact short |
| zoom-in | acercamientos | 0,11 | zoom in whoosh rise |
| whoosh | barridos y transiciones | 0,12 | whoosh transition fast |
| wosh-suave | entradas suaves de texto | 0,10 | soft whoosh swoosh |
| flash-obturador | flash entre ideas | 0,09 | camera shutter click flash |
| pop | gráfico, sticker, humor | 0,09 | pop bubble ui |
| riser | subida antes de una revelación | 0,09 | riser short build up |
| tap | letras que aparecen, tecleo | 0,07 | keyboard typing click single |
| click | interfaz: botón, tarjeta | 0,07 | ui click soft |
| contador | cifras que suben | 0,07 | counter ticking digital numbers |
| shine | logro, tilde, resultado | 0,07 | shine sparkle chime |
| digital-text | texto tecnológico o glitch | 0,07 | digital text typing glitch |

---

## 10. Música

La música se elige para que el espectador **sienta el ángulo** del video. Las palabras dicen qué pensar; la música dice qué sentir.
1. Marcar el ángulo y la emoción de cada tramo (hook, desarrollo, giro, solución, CTA).
2. Dibujar el arco emocional. Si hay giro, la música cambia en el giro (o corta a **silencio de 0,5-1 s** antes de la frase clave).
3. Traducir la emoción a 5 perillas: modo (mayor/menor), tempo, energía, instrumentos, densidad.
4. Buscar instrumental (con voz encima, la letra molesta). Proponer 2-3 opciones por tramo. **El agente no escucha audio: la persona valida de oído.**
5. Volumen al 10-20 %. Baja cuando la frase importa. Cortes sobre el beat.

| Emoción | Cómo suena | Buscar |
|---|---|---|
| Dolor | menor, tensión, pulso insistente | cinematic tension, urgent strings, dark pulse |
| Tristeza | menor, lento (60-80 BPM), piano | sad piano, melancholic |
| Catarsis | contenida que crece y explota | emotional build up, cinematic rise |
| Motivación | mayor, 110-130 BPM, batería que empuja | motivational, inspiring uplifting |
| Aspiración | mayor, etérea, pads | dreamy, uplifting ambient, luxury |
| Humor | quirky, pizzicato; o épica sobre algo trivial | funny quirky, dramatic orchestral |
| Curiosidad | pulso bajo, suspenso | mystery, suspense pizzicato |
| Indignación | menor, rítmica y dura | dark trap, phonk |
| Autoridad | neutra, 85-100 BPM, groove suave | lofi hip hop, jazz hop |
| Calma | lenta, texturas naturales | meditation, handpan |
| Confianza | mayor, segura, con estilo | confident hip hop, smooth jazz |
| Urgencia | pulso rápido, riser, tic-tac | countdown, ticking tension |

Prueba final: si el video sin música transmite más, la pista está mal.

---

## 11. Audio de la voz

- **Loudness final: -14 LUFS**, pico ≤ -1 dBTP. El audio de celular suele venir a -20 LUFS: hay que subirlo.
- Cadena: limpiar ruido (DeepFilterNet, neuronal) → EQ de voz (paso alto en 80 Hz) → compresión suave → normalización a -14 LUFS en dos pasadas.
- Dar versiones (suave, media, fuerte) para elegir de oído. El agente mide (LUFS, espectrograma) pero no escucha.
- Para entregar, reemplazar solo el audio sin tocar el video original.
- **Cortar silencios:** margen de 0,1-0,2 s a cada lado, nunca cortar dentro de una palabra. En español, muletillas: "eh", "este", "o sea", "pues". De las tomas repetidas, dejar la última completa. **Un video ya editado casi no tiene silencios: cortar más lo vuelve robótico.** Primero listar qué se cortaría y después cortar.

---

## 12. B-rolls

### Función
Cada b-roll explica, muestra, refuerza una emoción, representa un concepto, da contexto o cambia la narrativa. Correspondencia **específica** con lo que se dice. Modernos, de calidad, sin marcas de agua. Lo generado con IA es representación, nunca evidencia.

### Fuentes, en orden
1. **Banco propio** del creador, ya renombrado por tema, emoción y uso.
2. Pexels, Pixabay, Coverr, Mixkit (video); Giphy o Tenor (stickers, memes); PNG recortados. **Descargar solo con OK**, anotando licencia y origen. En Pixabay ignorar los "patrocinados de iStock" (son pagos).

### Cómo elegir
Leer la transcripción, buscar por la idea de cada frase, traer 2-3 candidatos, **mirarlos** (cuadros) junto al cuadro del video y descartar los que no calzan con el tema o no se leen sobre el fondo.

### Tratamiento
| Caso | Tratamiento |
|---|---|
| Escena, ambiente, dato, demostración larga | pantalla completa, 3-6 s |
| Humor, énfasis, estilo meme | recortar el fondo y ponerlo sobre el video, cerca del hombro, sin tapar la cara |
| Reacción corta, emoji | sticker animado de 1-2 s |
| Explicar mientras habla | media pantalla o tarjeta |
| B-roll vertical o cuadrado en video horizontal | centrado con el mismo video desenfocado detrás |
| Marca nombrada | primero un b-roll de esa marca; si no hay, su logo (PNG) arriba al costado de la cabeza |
| Lista de países o lugares | la bandera real flameando detrás de la persona recortada |

Máximo 2 capas a la vez, algo en pantalla en el primer segundo, ningún b-roll más de 3 veces, sin repetir clips iguales. Datos personales o de terceros en capturas: desenfocarlos.

---

## 13. Catálogo de efectos

No son obligatorios: se usan solo si cumplen una función. Tope de trabajo: 3-4 en 60 s, de 2 a 4 s cada uno, con la entrada en menos de 0,5 s.

| Efecto | Función | Cuándo | Evitar |
|---|---|---|---|
| Rompe el marco | sorpresa de apertura | curiosidad, hook | reflexivos; sin aire sobre la cabeza |
| Atraviesa la escena | separador entre bloques | educativo, cambio de idea | más de 1-2 por video |
| Letras de cristal / palabra detrás | peso a una palabra clave | autoridad, tecnología | fondos claros, frases largas |
| Órbita | herramientas o productos alrededor de la cabeza | prueba social, claridad | si el hook ocupa ese espacio |
| Interfaces flotantes | mostrar un sistema o resultado en vivo | claridad, SaaS | cifras inventadas |
| Muro de titulares | listar ideas u objeciones | identificación | textos largos |
| Celular con vida | mostrar un perfil o una app | prueba social, CTA | material privado |
| Gráfico que crece | datos en imagen | autoridad, antes/después | **cifras que no son reales** |
| Garabatos vivos | dirigir la mirada, humor | humor, cercanía | contenido serio o financiero |
| Zoom digital (marco REC + contador) | enfatizar una frase | curiosidad, remates | zooms seguidos |

Reglas: una función por efecto · los que rodean la cabeza ocupan el espacio del hook y del subtítulo (decidir qué texto se apaga) · usar colores y fuentes de la marca · datos reales siempre · grabación vertical, con trípode, fondo despejado y luz de frente para los efectos que recortan a la persona.

---

## 14. Diseño de carruseles y piezas gráficas

- Formato 1080×1350. Escala tipográfica: 32 / 43 / 57 / 76 / 101 px. VOZ 38 px (mínimo 28), GOLPE y ACENTO 101 px, DATO 260 px, etiqueta 24 px. Máximo 3 niveles por slide y 1-4 palabras de acento.
- Flujo: marca → hilo conductor → guion visual → plan de diseño (roles, tamaños, tratamientos, gatillo por slide) → construcción → control de calidad.
- **Marca primero:** colores, logo, estructura de plantilla y estética de la marca mandan. La estructura puede parecerse a la de piezas anteriores aprobadas, pero nunca ser igual. Nunca inventar otra estética.
- Fondos sobrios, poco colorinche: **un acento por slide**.

| Tramo | Gatillo | Tipografía |
|---|---|---|
| Hook y portada | curiosidad, dolor o provocación | GOLPE + 1 palabra de ACENTO |
| Re-hook y problema | identificación o dolor | VOZ + ACENTO manuscrita corta |
| Desarrollo | claridad o autoridad | titular en VOZ o GOLPE; DATO y listas numeradas |
| Giro | intimidad, aspiración | ACENTO grande y mucho aire |
| Prueba | datos | DATO con cifras lineales |
| Cierre y CTA | un solo énfasis | palabra clave en ACENTO o GOLPE |

- Variar el énfasis entre slides seguidos (cursiva, peso, color, subrayado).
- Texto sobre foto o persona recortada: usar un scrim o panel del 40-75 % en lugar de depender de la sombra.
- **Portada en motion:** se anima con CSS o GSAP y se exporta a MP4. Para que un personaje ilustrado se mueva, generar el clip con IA de video (imagen → video) y quitar el fondo cuadro por cuadro.
- Revisar cada slide al 25 % de su tamaño: la jerarquía tiene que seguir leyéndose.

---

## 15. Flujo de trabajo completo, paso a paso

**Antes de tocar nada**
1. Leer este manual y el perfil del creador. Si no existe perfil, copiar la plantilla, completarlo y pedir 2-3 ediciones de referencia del creador.
2. Brief en 3 líneas: objetivo, emoción o gatillo, plataforma y duración.
3. Plan en lenguaje simple y visto bueno antes de renderizar a lo grande.

**Edición** (siempre sobre copias: el original no se toca)
| Paso | Qué | Herramienta |
|---|---|---|
| 1 | Leer la toma | `leer_toma.py` |
| 2 | Transcribir con tiempo por palabra; verificar números y nombres propios | HyperFrames + Parakeet, o Whisper |
| 3 | Cortar silencios y tomas falladas | `ffmpeg-skill` (`silence.py --list` primero) |
| 4 | Audio: limpiar y normalizar a -14 LUFS | DeepFilterNet + `loudness.py` |
| 5 | B-rolls | sección 12 |
| 6 | Subtítulos de 4 capas | motor `Subtitulos` (plan → máscara → render) |
| 7 | Animaciones, zooms, transiciones | sistema de tipografía (GSAP), efectos propios |
| 8 | Sonido | `mezclar-sfx.mjs` |
| 9 | Entrega: render propio, o borrador de CapCut para retoque | `render-subtitulos.mjs`, `armar-borrador.mjs` |
| 10 | Chequeo | sección 16 |

---

## 16. Control de calidad antes de entregar

- **Técnica:** 9:16, 1080×1920, nítido, sin deformar, 30 fps.
- **Hoja de cuadros:** mirar 12 cuadros del video + los 5-10 más claros y ocupados + la pieza al 25 % del tamaño. Nada tapa la cara, nada sale de la zona segura.
- **Subtítulos:** sistema de 4 capas aplicado, ortografía, sincronía de ±0,05 s, 17-20 caracteres por segundo, ubicación, ninguna palabra que no se dijo. **Comparar contra un cuadro de las referencias del creador.**
- **Visuales:** hook, b-rolls, gráficos, zooms y transiciones justificados.
- **Sonido:** voz clara a -14 LUFS, música abajo, efectos en sincronía y bajos.
- **Narrativa:** formato y emoción correctos, inicio que atrapa, cierre, nada innecesario.
- **Entrega:** copia liviana de menos de 30 MB para el celular (por WhatsApp, enviar como Documento). La de alta calidad queda guardada. Exportar de CapCut en 1080p, 30 fps, 15-20 Mbps, sin HDR. En Instagram, activar "Subir con la máxima calidad".
- **Honestidad:** decir siempre qué no se pudo verificar. El agente no oye audio y ve el video por cuadros, no en movimiento.

---

## 17. Perfiles por creador

Cada creador edita distinto. Antes de editar, el agente lee el perfil del creador en `perfiles\<creador>.md`. El perfil manda sobre las reglas generales. Se calibra con 2-3 ediciones de referencia de ese creador y se corrige con cada feedback, con fecha.

Contenido de un perfil (ver `perfiles\_PLANTILLA.md`): identidad y público · receta de subtítulos (VOZ, ACENTO, GOLPE, posición, tratamiento) · animaciones y transiciones preferidas · ritmo (cortes por minuto, pausas, muletillas) · tipos y fuentes de b-roll · sonido (densidad, sonidos firma, música) · referencias analizadas · correcciones con fecha.

El perfil de ejemplo `perfiles\Valentin.md` es el estilo aprobado del creador original: úsalo como punto de partida y reemplazalo por el tuyo.

**Videos de referencia:** cuando se le pasa al agente un video sin instrucciones, es una referencia. La analiza (cortes, ritmo, animaciones cuadro a cuadro, subtítulos, sonido), anota lo aprendido en el manual o en el perfil y aprende a replicarlo, sin preguntar.

---

## 18. Herramientas del agente

Todas están en `herramientas\`. La instalación está en `INSTALAR.md`.

| Herramienta | Qué hace |
|---|---|
| `Subtitulos\plan-subtitulos.py` | Transcript palabra por palabra + lista de claves → plan por capa (voz, golpe, cursiva) con el tiempo de cada palabra |
| `Subtitulos\matte.py` | Máscara de la persona cuadro por cuadro (para poner texto detrás de ella), con suavizado en el tiempo. Usa el segmentador de MediaPipe del skill `/efectos` |
| `Subtitulos\render-subtitulos.mjs` + `subtitulos.html` | Dibuja las capas con transparencia (Chrome + GSAP) y las compone con ffmpeg: video → texto de atrás → persona → texto de adelante. 25 s ≈ 3 min de render + 2 min de máscara |
| `Subtitulos\armar-subtitulos.py` | Versión simple: transcript → SRT de voz y de claves (solo para borradores de CapCut) |
| `Tipografia\leer_toma.py` | Lee la toma: plano, caras, espacio sobre la cabeza, banda para el subtítulo y su tratamiento, energía y colores de acento sugeridos |
| `Tipografia audiovisual\` | Sistema de roles en CSS (`tipografia.css`), entradas animadas con GSAP (`entradas.js`: `TIP.entrada/palabras/salida/cuenta`), fuentes libres (OFL) y un demo |
| `Efectos propios\` | Zoom digital, garabatos vivos y atraviesa la escena (HTML + GSAP), con su render por cuadros |
| `Efectos de sonido\` | `mapa-sfx.json` (categorías, volúmenes, prioridades), `mezclar-sfx.mjs` (mezcla por fracción del pico de la voz, tope por minuto, alterna variantes, -14 LUFS), `preparar-biblioteca.mjs` (corta sonidos descargados en clips cortos) y `prueba-de-oido.mjs` (arma un audio para validar los clips de oído) |
| `CapCut MCP\` | `armar-borrador.mjs` (arma un borrador completo de CapCut desde un JSON), `arreglar-borradores.mjs` (necesario en CapCut 9.x) y los arreglos al MCP VectCutAPI |
| `Analisis de video\analizar.mjs` | Analiza un video de referencia: cortes, ritmo, movimiento por segundo, golpes de audio, LUFS, ráfagas de 12 cuadros a 20 fps para medir animaciones |
| `Seguimiento de cara\track.mjs` | Posición de la cara por cuadro (para que los subtítulos sigan a la persona) |
| Skills externas | `/efectos` (19 efectos detrás y alrededor de la persona; MIT), `ffmpeg-skill` (42 herramientas de ffmpeg: silencios, loudness, 9:16, exportes, chequeo; MIT) |

**CapCut:** el MCP arma cortes, textos, subtítulos, audio y zoom, pero **no** hace glow, texto detrás de la persona ni animaciones de entrada. CapCut sirve para cortes, audio y retoque manual. El diseño de subtítulos sale del render propio.

---

## 19. Errores ya cometidos y cómo no repetirlos

| Error | Corrección |
|---|---|
| Subtítulo plano (blanco + contorno fino, sin animación, una fuente) | Sistema de 4 capas siempre. Comparar con las referencias antes de entregar |
| Colores pálidos | Un acento saturado al 100 % con glow del mismo color |
| Contornos negros gruesos | Sombra suave en capas; nada de contorno duro |
| Texto sobre los ojos o las cejas | La cursiva y los acentos van sobre el pelo, la pared o el hombro |
| Biblioteca de sonidos sintéticos | Sonidos reales grabados, validados de oído |
| Impacto debajo de un zoom | El sonido imita el movimiento: zoom = whoosh que sube de tono |
| Un sonido por cada animación | Máximo 10 por minuto, solo en palabras clave |
| Subtítulos verticales en CapCut | Bug del MCP (`vertical=True` por defecto): corregido en el paquete |
| Proyecto de CapCut que no aparece | CapCut 9.x lee `draft_content.json`: correr `arreglar-borradores.mjs` y reiniciar CapCut del todo |
| Video agregado a CapCut con una ruta que no existe | El MCP no avisa: verificar que el archivo existe antes de agregarlo |
| Filtros, viñeta o fondo desenfocado sobre la persona | Nada de filtros sobre el video a cámara |
| Animación de personaje con imágenes fijas + boca dibujada | Para personajes que hablan, IA de video (imagen → video con lip sync) |
| Cortar silencios de un video ya editado | Listar primero; si casi no hay silencios, no cortar |
| Transcripción con errores en nombres propios y números | Verificarlos con la persona antes de publicar |

---

## 20. Lo que todavía no está probado

- Zoom digital y efectos propios con la cara en movimiento, y dentro de HyperFrames o CapCut.
- Muletillas en español con un motor de voz local.
- Detección de manos y micrófono en `leer_toma.py` (hoy solo detecta caras y silueta).
- Buscador automático de b-rolls en internet y clipeo automático de videos largos.
- Los volúmenes, el tope por minuto y la matriz de gatillos son hipótesis hasta tener métricas reales (retención, guardados, compartidos).
- La máscara de la persona en Windows es menos fina en pelo y dedos que en Mac.
