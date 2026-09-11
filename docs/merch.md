# Sección de merch

La sección `#merch` aparece después del programa y está incluida en los menús de escritorio y móvil. Presenta seis franelas con las vistas frontal y trasera suministradas: Coffee Club RCx en blanco, negro y azul, AeroPress AP en beige y AeroPress APx en beige y rojo. Conserva el fondo vinotinto, tubo continuo, flechas laterales, arrastre y navegación con teclado (izquierda, derecha, Inicio y Fin).

El desplazamiento del tubo impulsa el balanceo desde el gancho. La integración física usa pasos fijos de 1/120 s y se detiene al asentarse. Cada franela tiene distinta respuesta al impulso, intensidad y amortiguación; las copias también varían de forma determinista. Los perfiles se definen en `src/lib/merch-sway.mjs`. El carrusel conserva siete elementos y recicla los que quedan fuera de pantalla para recorrer la colección en ambos sentidos.

Cada franela muestra «Ver producto». Al pasar el cursor sobre ella o enfocar su enlace, aparece el botón «Lo quiero». En dispositivos sin hover, el botón permanece visible. Abre una consulta por WhatsApp con el modelo y color correspondientes, usando el contacto principal de `src/data/event.ts`; el mensaje se prepara en `merchInquiry`, en `src/data/merch.ts`. Arrastrar desde el enlace no lo activa y solo el producto central entra en la secuencia de tabulación.

«Ver producto» conserva su posición sobre la camisa y su transición a «Lo quiero». A cada lado tiene una flecha alargada sin fondo que describe una curva elíptica hacia la parte trasera de la prenda. El tramo cercano es más grueso y el lejano más fino y suave; ambas flechas se reflejan para rodear los costados, siguiendo el sketch suministrado. Sus áreas de pulsación miden entre 64 y 80 px de ancho y 64 px de alto. La izquierda gira hacia la izquierda y la derecha hacia la derecha. La prenda rota 180° en perspectiva hasta la siguiente cara, mientras el balanceo sigue actuando desde el gancho en un contenedor independiente. La cara elegida se conserva por modelo al reciclar elementos del carrusel. Los clics rápidos continúan o invierten el giro desde su ángulo actual sin acumular vueltas. Girar no inicia un arrastre ni abre WhatsApp. En móvil se muestran las dos flechas de la camisa central para evitar solapamientos.

El avance automático espera 5,5 segundos después del reposo. Se pausa con el botón, el foco, el puntero, durante el giro, al salir de pantalla o al ocultar la pestaña. Con movimiento reducido, la selección y la cara cambian inmediatamente y se desactiva el avance automático. Sin JavaScript quedan seis vistas frontales en una galería con desplazamiento nativo; los botones de giro se ocultan.

## Cambiar los mockups

La cabecera muestra «En colaboración con» junto al logo de 2XXX debajo del título, sin la frase descriptiva anterior. El logo abre el Instagram de `@dos.mile` en otra pestaña, la misma cuenta registrada en los patrocinadores. La etiqueta «Próximamente» vuelve a la esquina superior derecha. `public/images/merch/2xxx-logo.png` conserva el PNG original transparente; CSS lo presenta en claro para contrastar con el fondo vinotinto.

- Los datos están en `src/data/merch.ts`.
- Las doce imágenes de entrega están en `public/images/merch/`, en WebP de 1200 × 1200 px con transparencia. Cada producto tiene `front` y `back`; los nombres conservan la distinción AP / APx de los originales.
- `node scripts/prepare-merch.mjs "carpeta de originales"` convierte los doce PNG sin modificar sus estampados, recortar el lienzo ni reemplazar el canal alfa. El inventario está en `docs/source-assets/merch-supplied.json`; las doce vistas suman 586.786 bytes.
- El gancho es un SVG de alambre metálico detrás de cada cara, con contorno redondeado, sombra y reflejo fino. Sus hombros entran bajo la silueta de la tela sin piezas negras sólidas sobre el cuello. El conjunto conserva una proporción 2:3 y el punto de balanceo está al 50% horizontal y al 5% vertical.
- Los nuevos mockups incluyen su estampado; ya no se superpone el logo provisional. No se añadieron precios, tallas ni fechas de venta.

## Recursos generados

Se utilizó la herramienta integrada `image_gen` para crear los tres mockups provisionales, sin copiar marcas ni estampados de las referencias. Los PNG originales se conservan en `docs/source-assets/merch/`. El conjunto exacto de prompts está en `docs/source-assets/merch-generation.json`. La conversión a WebP conserva el canal alfa. Las tres imágenes de entrega suman 214.526 bytes.

## Verificación

Revisión de las flechas direccionales: se restauró el enlace central a su posición original (50% horizontal, 64% vertical), con dos botones de 48 px a sus lados. En el navegador se comprobaron rotaciones intermedias de signo opuesto al girar desde el frente hacia izquierda y derecha, el regreso al frente, el giro por teclado y la transición del enlace a «Lo quiero». A 320 px los tres controles caben sin desbordamiento; las flechas de navegación quedan más arriba para no solaparse con las de giro.

Revisión de las camisas suministradas: Astro Check sin errores, compilación correcta y 20 pruebas aprobadas. En la vista previa de producción se comprobaron las doce imágenes, el giro por clic y por teclado, la vuelta al frente, la independencia entre modelos y la cara conservada al recorrer el extremo del carrusel. Se revisaron 1280 y 390 px de ancho; en móvil el control de giro mide 48 × 48 px y no hay desbordamiento horizontal. El arrastre sobre la prenda selecciona la siguiente camisa y no muestra el borde de foco del carrusel. Los enlaces preparan la consulta de WhatsApp con modelo y color.

`npm run build` ejecuta Astro Check y la compilación de producción. `npm test` ejecuta 20 pruebas, incluidas tres sobre el balanceo: variación de amplitud y fase, estabilidad y reposo, y simetría al invertir el movimiento. La comprobación visual e interactiva se realiza sobre la compilación de producción, en escritorio y con viewport móvil: imágenes, tubo, flechas, teclado, pausa, centrado y balanceo.

La preferencia de movimiento reducido y la cancelación de gestos también se manejan en el script. La revisión con un viewport pequeño no sustituye una prueba en Safari y un teléfono físico.

Resultado de la revisión del 9 de septiembre de 2026: compilación correcta, Astro Check sin errores y 17 pruebas existentes aprobadas. Se verificaron viewports de 1280, 390 y 320 px, controles de 48 px, carga de las tres imágenes y ausencia de desbordamiento horizontal. Inicio seguido de flecha izquierda selecciona el tercer concepto; un arrastre hacia la izquierda vuelve al primero. Tras asentarse, todos los ángulos vuelven a cero y la diferencia entre el centro de la prenda activa y el del carrusel es menor de 0,001 px. Al navegar al inicio, el estado pasa a `paused`. El avance automático y su botón de pausa también se comprobaron en el navegador.

El carrusel animado usa `overflow: clip` y desactiva el ajuste de scroll nativo: de otro modo, el navegador podía desplazar internamente la galería mientras se actualizaban las transformaciones y desalinear la selección.

Revisión de los enlaces y variaciones de movimiento: Astro Check sin errores, compilación correcta y 20 pruebas aprobadas. En el navegador se comprobó la transición al botón, el texto de WhatsApp por color, el foco por teclado y un arrastre desde el enlace que selecciona la siguiente franela sin abrir otra pestaña, seleccionar imágenes ni mostrar el borde del carrusel. Los ángulos difieren durante el movimiento y vuelven a cero al terminar. El botón cabe en el viewport de 390 px y conserva un área de 144 × 48 px.
