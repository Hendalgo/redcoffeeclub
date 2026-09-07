# Verificación de la revisión cinematográfica · 7 de septiembre de 2026

## Entrada del hero y preparación del café refinadas

La entrada inicial coordina un retroceso suave del paisaje, un pequeño giro del producto, el despliegue de las líneas del título y la aparición del CTA. La animación de entrada utiliza capas independientes de las que controla el scroll. Se completa al empezar a desplazarse y se omite en recargas desde secciones posteriores. El CTA pasa a «Explora el método», con una flecha vertical y estados de interacción. Se retiró el botón manual de movimiento y su estado persistido; continúa la adaptación a `prefers-reduced-motion` del sistema.

Hidra se presenta blanco tanto en patrocinadores como en el crédito mediante un filtro CSS que conserva la silueta y transparencia del PNG original. No se modificó ni regeneró el logo.

La preparación tiene movimientos más largos y trayectorias curvas para el émbolo, entrada y salida progresivas de cuchara y hervidor, mezcla circular, separación del mezclador antes de introducir el pistón y retirada de la base antes de desplazar el AeroPress. La cámara abre el encuadre al apartar las piezas y se acerca al extraer y servir. Las entradas de agua y presión tienen seguimiento visual amortiguado; las ondas del café decaen y el render se detiene tras 600 ms sin entrada. Los textos cambian con una transición, el control de presión tiene un foco visible sobre el tirador y repetir usa un fundido.

- `npm test`: 12 pruebas de coreografía aprobadas, incluyendo separación de piezas durante mezcla y servicio.
- Compilación completada sin errores de tipos. Se conserva el aviso de tamaño del paquete de Three.js. La preparación continúa en un módulo independiente de aproximadamente 7,2 KB gzip, con 2,2 KB gzip de estilos.
- `scripts/hero-polish-qa.mjs`: producción a 1440 × 900, 390 × 844, 320 × 568 y 667 × 375, con entrada completada, CTA visible y funcional, ausencia del botón de movimiento, dos logos de Hidra blancos, ausencia de desbordamiento y recarga del capítulo sin volver a ejecutar la entrada. Movimiento reducido comprobado. Evidencia en `docs/qa/motion-polish/production/`.
- `scripts/brew-qa.mjs`: preparación completa en los mismos cuatro tamaños, con capturas durante montaje, café, agua, mezcla y servicio. Vertido parcial, pausa, presión por arrastre y teclado, reinicio y cierre con restauración de foco y posición. Evidencia en `docs/qa/brew/motion-polish-production/`.
- `scripts/brew-input-qa.mjs`: pruebas táctiles con movimiento normal y reducido, cierre durante vertido y recuperación tras pérdida de WebGL, aprobadas en la versión compilada. La comprobación de reposo se aprobó también en desarrollo.
- `scripts/navigation-qa.mjs`: navegación, atrás/adelante y recarga de capítulos y equipo siguen pasando en escritorio y móvil. Sin errores de JavaScript en las pruebas completadas.

La revisión final del encuadre volvió a pasar la preparación completa a 1440 × 900, con capturas intermedias en `docs/qa/brew/motion-framing-final/`; el émbolo apartado permanece dentro de la escena. También se comprobó iniciar el scroll mientras se ejecuta la entrada del hero: la entrada termina en su estado final y cede el control al recorrido.

## Preparación interactiva al final del AeroPress

El botón «Prepara tu café» abre un diálogo con una mesa 3D independiente: montaje de filtro y base, café molido animado, vertido al mantener pulsado, mezcla, presión arrastrando el émbolo y taza servida. El agua se pausa al soltar y la presión transfiere progresivamente el líquido de la cámara a la taza. Se puede repetir o cerrar en cualquier momento. La importación del módulo y sus estilos se realiza al abrir; comparte la fábrica del AeroPress y libera los recursos adicionales al cerrar. Ambos canvas dejan de renderizar en reposo.

- `npm test`: 12 pruebas aprobadas. Las nuevas comprueban el orden del montaje, separación de base y taza, entrada del pistón por encima de la cámara, conservación del líquido, reinicio y límites de los gestos.
- `npm run build`: 41 archivos, sin errores de tipos, advertencias de tipos ni hints. El módulo de preparación se separa en aproximadamente 6,5 KB gzip de JavaScript y 2 KB gzip de CSS. Se conserva el aviso previo de tamaño del paquete que contiene Three.js.
- `scripts/brew-qa.mjs`: recorrido completo en producción a 1440 × 900, 390 × 844, 320 × 568 y 667 × 375. Se comprobaron vertido parcial y pausa, arrastre real del control del émbolo, extracción con teclado, taza final, reinicio, restauración del foco y scroll y eliminación del canvas adicional. Sin desbordamiento horizontal ni errores de JavaScript. La ejecución en desarrollo también comprobó cero fotogramas adicionales al quedar en reposo. Evidencia en `docs/qa/brew/production/`.
- `scripts/brew-input-qa.mjs`: eventos táctiles reales de navegador a 390 × 844, con movimiento normal y reducido. Vertido parcial, presión por arrastre, finalización, cierre a mitad del agua y pérdida inducida del contexto WebGL. El fallo deshabilita la preparación y permite volver al evento, conservando su escena principal. Sin errores de JavaScript; resultados en `docs/qa/brew/inputs/`. Se trata de emulación en Edge, no de medición en un teléfono físico.
- `scripts/navigation-qa.mjs`: la navegación principal, atrás/adelante y recarga dentro del despiece y del equipo siguen pasando en escritorio y móvil.

Los tiempos del recorrido son una simulación visual abreviada. No representan una receta con cantidades, temperatura o tiempo de infusión calibrados.

La revisión visual final corrigió el orden de transparencia del líquido: ahora escribe profundidad antes de dibujar las paredes de la cámara, de modo que el nivel de infusión permanece visible. Se volvió a recorrer la preparación completa en desarrollo a 1440 px (`docs/qa/brew/fluid-final/`).

## Originales de patrocinadores y nuevo orden del equipo

Se incorporaron 24 logos individuales del Drive y el logo dorado de Hidra. Kofy y el sello junto a Mediterráneo conservan sus recortes del cartel porque no aparecen entre los archivos compartidos. Total: 27 marcas, sin repetir el isotipo de Aillio ni el logo organizador de RED. Los enlaces conocidos se conservaron; Laura Sofía Marcano, H77, Rancho Victorio y Dos Mile enlazan desde sus logos. Proyecto ARSH mantiene su enlace al pie. Los originales PNG quedan intactos y Astro genera WebP con encuadres que compensan los márgenes transparentes.

El equipo pasa a Yoshio Kayo → Andrés García → Luis Tovar → Hernán Velásquez, manteniendo retratos y biografías asociados. `npm run build` completó 34 archivos sin errores de tipos y optimizó 24 imágenes; continúa el aviso previo de tamaño de Three.js.

`scripts/sponsors-team-qa.mjs` verificó producción a 1440 × 1000, 768 × 1024, 390 × 844 y 320 × 568: 27 marcas únicas, carga de las imágenes, las tres procedencias correctas, enlace de Laura, ausencia de desbordamiento y orden del equipo. Se recorrieron las cuatro personas con los botones, comprobando contador, límite final y centrado de las flechas. Sin errores de JavaScript. Capturas e informe en `docs/qa/sponsors-originals/`.

## Paisaje entre comunidad y Margarita

El manifiesto incorpora la costa existente como fondo oscurecido, con un desplazamiento suave y un fundido hacia los extremos. Se redujo el espacio inferior de 150 a 64 px en escritorio y de 90 a 48 px en móvil. La imagen de Margarita empieza más ancha y se abre desde su primera entrada en pantalla, mediante una animación independiente del tramo de lectura. El título acompaña esa entrada; los textos y el mapa conservan su tiempo de lectura. La máscara sigue en un contenedor fijo para que el zoom interior no corte la curva.

`npm run build`: 34 archivos sin errores de tipos; se mantiene el aviso previo de tamaño de Three.js. `scripts/transition-qa.mjs` verificó producción a 1440 × 900, 500 × 900, 390 × 844, 320 × 568 y 667 × 375: apertura antes de llegar arriba, imagen completamente abierta al avanzar, recorrido inverso, recarga a mitad de la entrada y ausencia de desbordamiento. Con movimiento reducido, el paisaje y todo el contenido permanecen visibles sin animación. Sin errores de JavaScript. Comparativas en `docs/qa/transition/atmosphere-before/` y `docs/qa/transition/atmosphere-after/`.

La comprobación de los trazos de la isla volvió a pasar a 1440, 390 y 320 px: dibujo gradual, mapa completo dentro de pantalla, separación del texto en móvil y recarga conservando los trazos parciales.

## Fluidez del AeroPress

Las pausas de lectura estaban aplicadas también al modelo. En un recorrido de diez segundos aparecían paradas de aproximadamente 1,3 segundos entre capítulos. Ahora el texto conserva sus pausas y el 3D recorre una curva cúbica monótona con velocidad continua, sincronizada con el centro de cada capítulo. El botón «Descubre» lleva al centro del primer capítulo.

El ciclo de renderizado bajo demanda se reiniciaba desde un ciclo de animación independiente, dejando pasar fotogramas alternos en esta medición. Ahora se mantiene activo durante las ráfagas de movimiento y se apaga al terminar. En Edge con Intel Graphics, a 1440 × 900, la mediana del intervalo entre fotogramas del modelo pasó de 12,1 ms a 6,1 ms. El percentil 95 quedó en 6,2 ms. La prueba a 390 × 844 dio también 6,1 ms de mediana. Son mediciones locales con viewport emulado, no una prueba de GPU en teléfono físico.

`scripts/smoothness-qa.mjs`: sin paradas artificiales de más de 150 ms entre capítulos, con el modelo avanzando mientras el texto permanece quieto y cero fotogramas adicionales en reposo. Evidencia anterior en `docs/qa/smoothness/before.json`; resultados en `after-1440.json` y `after-390.json` de la misma carpeta.

Nueve pruebas unitarias aprobadas, incluidas continuidad de velocidad y monotonicidad. Compilación de 34 archivos sin errores de tipos. Las comprobaciones de navegación, capítulos, atrás/adelante y recarga de producción volvieron a pasar en escritorio y móvil. Se mantiene el aviso previo de tamaño de Three.js.

## Trazos de la isla

Se separaron los cuatro trazos interiores del SVG compuesto y se normalizó cada longitud. La animación utiliza atributos SVG con valores fraccionarios para evitar saltos por redondeo de píxeles. Guarame y su conexión aparecen juntos después del contorno. El grosor permanece estable al cambiar de tamaño y el texto del mapa ya no hereda el borde de los iconos.

En móvil, el mapa ocupa una fila propia antes del texto y su animación responde a su entrada en pantalla. El dibujo se completa mientras aún está visible. Se conserva la apertura de la fotografía y su duración.

`npm run build`: 33 archivos sin errores de tipos; permanece el aviso previo de tamaño de Three.js. `scripts/island-lines-qa.mjs` comprobó la versión de producción a 1440 × 900, 390 × 844 y 320 × 568: dibujo gradual, mapa completo dentro de pantalla, separación del texto, recorrido inverso y recarga a mitad del trazo con precisión inferior a un píxel. Sin errores de JavaScript. Capturas e informe en `docs/qa/island-lines/after/`; referencia anterior en `docs/qa/island-lines/before/`.

## Lectura, separación de textos y recarga

El viaje principal dispone de tramos de lectura con texto y pose inmóviles entre las transiciones. Requiere 8,5 alturas de pantalla de scroll en escritorio y 7,5 en móvil; los botones siguen llevando a cada capítulo. Margarita mantiene más tiempo su composición abierta y el equipo tiene más recorrido. El manifiesto desplaza menos sus líneas.

Se amplió el interlineado para separar descendentes y acentos, incluido «Una pequeña / revolución». En móviles de poca altura se ajustaron el tamaño del título y el encuadre del modelo, y las anotaciones conservan sus encabezados sin descripciones secundarias. El indicador inferior queda separado del botón de movimiento. El preloader conserva logo, línea y salida con cortinas, sin círculo de fondo.

La posición se guarda durante la lectura en la entrada del historial y se restaura después de montar los pins. También se sincroniza explícitamente la línea de tiempo de textos y modelo después de cada actualización de medidas: ScrollTrigger podía conservar el progreso del scroll y dejar la línea de tiempo interna reiniciada. La página se revela con ambos estados reconciliados.

- `npm run build`: 32 archivos comprobados sin errores, advertencias de tipos ni hints. Se mantiene el aviso de tamaño de Three.js de Vite.
- `npm test`: ocho pruebas aprobadas; cada capítulo permanece quieto durante al menos el 90 % de una altura de pantalla móvil de scroll y la navegación conserva su reversibilidad.
- `reload-reading-qa.mjs`, producción: recarga desde evento y patrocinadores a 1440 × 900, 500 × 900 y 390 × 844, conservando exactamente la posición de la sección. Sin saltos después de revelar la página y con el 3D en su estado final desde el primer fotograma visible. Sin errores de JavaScript.
- `navigation-qa.mjs`, producción: atrás/adelante, regreso desde otro documento, recarga dentro del despiece y del equipo, una única narrativa visible por capítulo y permanencia tras 300 píxeles de scroll. Sin duplicar canvas ni pins, en escritorio y móvil.
- `reading-layout-qa.mjs`: revisión visual de los cuatro capítulos a 320 × 568, 390 × 844 y 667 × 375; comprobación adicional del título en escritorio.

Evidencia en `docs/qa/reading/after/`, `docs/qa/reading/layout/` y `docs/qa/reading/navigation-report.json`. Las secciones siguientes documentan las revisiones anteriores.

## Continuidad entre el manifiesto y Margarita

El zoom de la fotografía y su máscara compartían elemento: la ampliación al 135 % sacaba la parte superior de la curva fuera de la sección, cuyo `overflow` la cortaba. La nueva capa `.territory-visual` contiene la máscara y el sombreado; solo su fotografía interior recibe el zoom. El fondo exterior coincide con el del manifiesto, evitando la franja rectangular de color vino. El pequeño círculo floral también mantiene su recorrido dentro del manifiesto en móvil.

Compilación sin errores de tipos. Se capturaron seis posiciones, incluyendo regreso hacia arriba, a 1440 × 900, 500 × 900 y 390 × 844 en la versión de producción: sin errores de JavaScript ni desbordamiento horizontal. Comparativas e informe en `docs/qa/transition/before/` y `docs/qa/transition/after/`.

## Revisión de carga, patrocinadores y equipo

Se identificó un primer fotograma del modelo con `enhanced: false` y la pose del despiece antes de adoptar el encuadre de la portada. La escena ahora lee el estado actual del recorrido antes de calcular cada pose y anuncia disponibilidad después del render, mediante `addAfterEffect`. El canvas permanece oculto hasta ese punto. El preloader coordina las fuentes, la imagen de costa, la disposición de ScrollTrigger y el primer fotograma, con salida manual y salida de respaldo a los ocho segundos. No utiliza un porcentaje de carga ficticio ni cambia las dimensiones del canvas al desaparecer.

Se incorporaron las 21 marcas del cartel y las cinco cuentas adicionales de la descripción, el crédito con el logo de Hidra, el orden Hernán → Yoshio → Andrés → Luis y flechas SVG centradas en los controles circulares. Los modales animan entrada, contenido y salida; Escape y clic exterior esperan la salida antes de cerrar y restaurar el foco. En pantallas horizontales de poca altura, isla y equipo usan desplazamiento natural.

- Compilación de 25 archivos comprobados por Astro, sin errores de tipos; seis pruebas de coreografía aprobadas. Se mantiene la advertencia informativa de Vite por el tamaño de Three.js.
- `inspect-startup.mjs`: todos los fotogramas capturados a 1440 × 900 y 390 × 844 usan la pose ensamblada y mantienen el scroll inicial en cero.
- `experience-qa.mjs`: 320 × 568, 360 × 667, 390 × 844, 500 × 900, 768 × 1024, 1024 × 768, 1440 × 900, 844 × 390 y 667 × 375, sin desbordamiento horizontal. Modal contenido dentro de cada viewport, transición de entrada y salida, regreso del foco, 21 marcas, logo de Hidra cargado, orden del equipo y centros de las flechas verificados.
- Carga de logo demorada, error al cargar el logo, WebGL ausente, descarga 3D bloqueada, movimiento reducido y JavaScript desactivado: el contenido queda disponible y el preloader nunca bloquea indefinidamente.
- Recorrido funcional de producción: capítulos y reversibilidad, giro con teclado, galería, modalidades, FAQ, PDF, menú y preferencias de movimiento, sin errores de JavaScript.
- `scene-layout-qa.mjs`: recorrido hasta el despiece completo y del primer al segundo integrante en cinco tamaños, incluidos 667 × 375 y 844 × 390. En desarrollo se verifica también la caja proyectada de toda la geometría, para detectar piezas que queden detrás del encabezado o fuera del viewport. Revisión visual de la sección de patrocinadores actualizada en el navegador integrado.

Evidencia de esta revisión: `docs/qa/experience/report.json`, capturas en la misma carpeta y registros de fotogramas en `docs/qa/startup/`. Las capturas y mediciones que siguen documentan la revisión cinematográfica anterior.

## Cambios de esta revisión

Se eliminó del HTML y del diseño la franja lateral que pertenecía al brief. La página ocupa todo el ancho. La referencia de interacción fue [Shopify Editions Winter 2026](https://www.shopify.com/editions/winter2026), inspeccionada visualmente durante sus transiciones: escenarios que cambian junto con objetos y tipografía, profundidad y navegación por capítulos.

La apertura y el despiece comparten **un único canvas**. Una línea de tiempo mueve el paisaje, los textos, el objeto y su encuadre. El AeroPress gira durante el cambio de escena y después separa sus piezas. Los cuatro botones permiten saltar a cada etapa. El giro manual permanece independiente del scroll.

El recorrido continúa con tipografía que se desplaza en direcciones opuestas, apertura de la costa mediante máscara, dibujo progresivo del mapa, aparición escalonada de datos, galería horizontal del equipo, progreso de la jornada y desplazamiento del macro de café. El encabezado permanece accesible y muestra el progreso del documento.

En escritorio hay tres escenas fijadas: viaje principal, isla y equipo. En móvil solo se fija el viaje principal; la galería tiene desplazamiento táctil nativo. El viaje ocupa 3,8 alturas de pantalla de scroll en escritorio y 3 en móvil. El botón de movimiento y la preferencia del sistema permiten una disposición sin escenas fijadas.

## Comprobaciones realizadas

- `npm run build`: Astro check sin errores, advertencias de tipos ni hints; páginas index y 404 generadas.
- `npm test`: seis pruebas aprobadas. Pausas, límites, secuencia mecánica, reversibilidad exacta y separación entre el viaje de cámara y el desmontaje.
- `scripts/cinematic-qa.mjs`: capturas del viaje en 0, 15, 33, 50, 69 y 94 %, con recorrido inverso, a 1440 × 1000 y 390 × 844.
- `scripts/cinematic-functional-qa.mjs`: navegación a capítulos, controles de giro y flechas del teclado, navegación del equipo, enlaces internos, modal de consulta, destino real de WhatsApp, contenido específico por alianza, PDF y FAQ.
- El mismo conjunto funcional se ejecutó sobre la compilación de producción en el puerto 4322. **Cero errores de JavaScript** en ambos recorridos.
- Sin desbordamiento horizontal en 360 × 667, 390 × 844, 768 × 1024, 1024 × 768 y 1440 × 900.
- Tras cambiar entre escritorio y móvil se conserva una única instancia de cada pin. Activar y desactivar el movimiento elimina y reconstruye los pins sin duplicar el canvas.
- Menú móvil: aislamiento del fondo, cierre con Escape y restauración del foco. Modales: cierre y regreso al control que los abrió.
- Anotaciones dentro del viewport en escritorio y móvil, también con giros 0°, 90°, 180° y −90°. Se corrigió el espacio entre las anotaciones y los controles inferiores en móvil.
- Preferencia de movimiento reducido: producto abierto y documento sin pins. Se mantienen los controles manuales.
- WebGL desactivado: respaldo de imagen visible, controles de giro ocultos, contenido y navegación disponibles.
- JavaScript desactivado: contenido esencial, imagen del producto y datos del evento presentes en HTML.
- Revisión visual adicional de la versión compilada dentro del navegador integrado de Codex.

## Rendimiento observado en esta versión

Edge 152, GPU integrada Intel mediante ANGLE/Direct3D 11, viewport 1440 × 1000. Se recorrieron 40 pasos automatizados por el viaje principal.

| Medida | Resultado |
| --- | --- |
| Fotogramas de la escena durante el recorrido | 221 en 2,96 segundos |
| Media durante ese recorrido | 74,6 por segundo |
| Fotogramas adicionales en reposo | 0 |
| Canvas WebGL | 1 |
| Llamadas de dibujo | 30 |
| Triángulos por fotograma | 26.164 |
| Paquete 3D gzip | Aproximadamente 238 KB |
| Script de coreografía gzip | Aproximadamente 3,6 KB |

Esta media incluye comunicación con el navegador y pausas del recorrido automatizado; no certifica rendimiento sostenido en todos los dispositivos ni sustituye una medición en teléfono físico. El renderizado es bajo demanda, sin físicas ni actualizaciones de estado React por fotograma. Se limita el DPR a 1,6.

Vite mantiene su advertencia por el tamaño sin comprimir de Three.js, superior a 500 KB. El GLB y el PDF no se solicitan al cargar la página. Las mediciones anteriores pertenecen al diseño previo y están archivadas en `qa/previous-verification.md`.

## Procedencia del AeroPress

El archivo `public/models/aeropress-original.glb` se generó localmente con geometría paramétrica escrita en `src/lib/aeropress-model.ts` y se exportó con `GLTFExporter`. No se obtuvo del fabricante, de 3D Jutsu ni de una biblioteca de modelos. La escena genera esa misma geometría directamente; el GLB es su exportación portable.

Es una aproximación visual, no CAD oficial ni una reproducción de dimensiones verificadas. La revisión de animación no cambia esa procedencia. Los datos de la edición 2025, retratos, logotipo y contactos conservan las fuentes registradas en `fuentes.md`.

## Evidencia de la revisión cinematográfica

- [Hero en escritorio](qa/cinematic/desktop-0.png)
- [Despiece en escritorio](qa/cinematic/desktop-94.png)
- [Hero móvil final](qa/cinematic/mobile-final-hero.png)
- [Despiece móvil final](qa/cinematic/mobile-final-exploded.png)
- [Menú móvil final](qa/cinematic/mobile-final-menu.png)
- [Equipo](qa/cinematic/desktop-equipo.png)
- [Resultado funcional en producción](qa/cinematic/functional-report.json)
- [Medición de rendimiento actual](qa/cinematic/performance-native-report.json)

## Revisión posterior · móvil, carga y líquido · 7 de septiembre de 2026

La última compilación obtuvo **92/100/100/100 en móvil y 100/100/100/100 en escritorio**, repetido en tres pasadas por perfil. Se midieron rendimiento, accesibilidad, buenas prácticas y SEO con Lighthouse 13.4.1 sobre el preview de producción. Son resultados locales de laboratorio, no datos de Core Web Vitals de usuarios reales.

El [informe completo](qa/lighthouse/RESULTADOS.md) enlaza las seis auditorías, la comparación inicial y la evidencia de ocho tamaños de pantalla, navegación/recarga, preparación completa y reposo de GPU. Las pruebas táctiles y con movimiento reducido también pasaron. `npm test` terminó con 14 pruebas correctas y la compilación con cero errores de tipos.

Las referencias actuales de taza de cristal, tetera moderna de vidrio y cuchara llevan la marca RED Coffee Club. Sus PNG, logo original y prompts están en `output/tripo-references/referencias-red-coffee-club.zip`; se entregan para crear los modelos y no reemplazan aún los accesorios paramétricos de la web.

## Modelos propios y preloader recuperado · revisión posterior

Los tres accesorios ya fueron modelados directamente desde las referencias y están integrados en la web. Se exportaron a GLB con sus materiales y marca en `output/models-red/`. El preloader con logo y apertura de cortinas, y las animaciones de entrada del hero, están recuperados. La nueva pasada de Lighthouse conserva 92 en móvil y 100 en escritorio, con 100 en las otras tres categorías. [Evidencia y archivos de esta revisión](qa/accessories/VERIFICACION.md).
