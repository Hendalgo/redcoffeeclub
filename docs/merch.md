# Sección de merch

La sección `#merch` aparece después del programa y está incluida en los menús de escritorio y móvil. Presenta tres conceptos de franela, con fondo vinotinto, tubo continuo, flechas laterales, arrastre y navegación con teclado (izquierda, derecha, Inicio y Fin).

El desplazamiento del tubo impulsa el balanceo desde el gancho. La integración física usa pasos fijos de 1/120 s y se detiene al asentarse. Cada franela tiene distinta respuesta al impulso, intensidad y amortiguación; las copias también varían de forma determinista. Los perfiles se definen en `src/lib/merch-sway.mjs`. El carrusel conserva siete elementos y recicla los que quedan fuera de pantalla para recorrer la colección en ambos sentidos.

Cada franela muestra «Ver producto». Al pasar el cursor sobre ella o enfocar su enlace, aparece el botón «Lo quiero». En dispositivos sin hover, el botón permanece visible. Abre una consulta por WhatsApp con el modelo y color correspondientes, usando el contacto principal de `src/data/event.ts`; el mensaje se prepara en `merchInquiry`, en `src/data/merch.ts`. Arrastrar desde el enlace no lo activa y solo el producto central entra en la secuencia de tabulación.

El avance automático espera 5,5 segundos después del reposo. Se pausa con el botón, el foco, el puntero, al salir de pantalla o al ocultar la pestaña. Con movimiento reducido, la selección cambia inmediatamente y se desactiva el avance automático. Sin JavaScript quedan tres imágenes en una galería con desplazamiento nativo.

## Cambiar los mockups

- Los datos están en `src/data/merch.ts`.
- Las imágenes de entrega están en `public/images/merch/`, en WebP de 768 × 1152 px con transparencia: `tee-ecru.webp`, `tee-charcoal.webp` y `tee-coffee.webp`.
- Usar una composición de proporción 2:3, con el gancho centrado horizontalmente y apoyado en el tubo a un 5% de la altura. El punto de giro está en esa misma posición.
- El logo oficial se superpone en `.merch-print`. Si los mockups definitivos ya incluyen el estampado, eliminar esa imagen del componente y la actualización de `slot.print` en el script.
- Cambiar nombres y colores en los datos y revisar el texto «Diseños en desarrollo» cuando esté confirmada la colección. No se añadieron precios, tallas ni fechas de venta.

## Recursos generados

Se utilizó la herramienta integrada `image_gen` para crear los tres mockups provisionales, sin copiar marcas ni estampados de las referencias. Los PNG originales se conservan en `docs/source-assets/merch/`. El conjunto exacto de prompts está en `docs/source-assets/merch-generation.json`. La conversión a WebP conserva el canal alfa. Las tres imágenes de entrega suman 214.526 bytes.

## Verificación

`npm run build` ejecuta Astro Check y la compilación de producción. `npm test` ejecuta 20 pruebas, incluidas tres sobre el balanceo: variación de amplitud y fase, estabilidad y reposo, y simetría al invertir el movimiento. La comprobación visual e interactiva se realiza sobre la compilación de producción, en escritorio y con viewport móvil: imágenes, tubo, flechas, teclado, pausa, centrado y balanceo.

La preferencia de movimiento reducido y la cancelación de gestos también se manejan en el script. La revisión con un viewport pequeño no sustituye una prueba en Safari y un teléfono físico.

Resultado de la revisión del 9 de septiembre de 2026: compilación correcta, Astro Check sin errores y 17 pruebas existentes aprobadas. Se verificaron viewports de 1280, 390 y 320 px, controles de 48 px, carga de las tres imágenes y ausencia de desbordamiento horizontal. Inicio seguido de flecha izquierda selecciona el tercer concepto; un arrastre hacia la izquierda vuelve al primero. Tras asentarse, todos los ángulos vuelven a cero y la diferencia entre el centro de la prenda activa y el del carrusel es menor de 0,001 px. Al navegar al inicio, el estado pasa a `paused`. El avance automático y su botón de pausa también se comprobaron en el navegador.

El carrusel animado usa `overflow: clip` y desactiva el ajuste de scroll nativo: de otro modo, el navegador podía desplazar internamente la galería mientras se actualizaban las transformaciones y desalinear la selección.

Revisión de los enlaces y variaciones de movimiento: Astro Check sin errores, compilación correcta y 20 pruebas aprobadas. En el navegador se comprobó la transición al botón, el texto de WhatsApp por color, el foco por teclado y un arrastre desde el enlace que selecciona la siguiente franela sin abrir otra pestaña, seleccionar imágenes ni mostrar el borde del carrusel. Los ángulos difieren durante el movimiento y vuelven a cero al terminar. El botón cabe en el viewport de 390 px y conserva un área de 144 × 48 px.
