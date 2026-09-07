# RED Coffee Club · AeroPress Margarita

Landing cinematográfica con Astro, TypeScript, un canvas React/Three.js para el recorrido y escenas reversibles dirigidas por GSAP ScrollTrigger. Una mesa de preparación interactiva se carga al solicitarla. La franja lateral del brief no forma parte de la web.

## Desarrollo

```sh
npm install
npm run dev
npm run build
npm run preview
npm test
```

El servidor de desarrollo usa http://127.0.0.1:4321. El resultado estático se genera en `dist/`.
En entornos restringidos puede ser necesario definir `ASTRO_TELEMETRY_DISABLED=1`. Las dependencias quedan fijadas en `package-lock.json`.


## Edición

- Datos, integrantes, contactos, FAQ y modalidades: `src/data/event.ts`. Cada grupo conserva sus páginas del PDF de origen.
- Patrocinadores: `src/data/sponsors.ts`, con 24 logos originales del Drive, dos marcas conservadas del cartel e Hidra. Los PNG están en `src/assets/sponsors/`; su inventario y márgenes transparentes están en `docs/source-assets/sponsors-drive.json`. Astro genera versiones WebP para la web. Los perfiles conocidos y los nombres pendientes se editan sin sustituir sus marcas.
- Página y contenido semántico: `src/pages/index.astro`.
- Diseño: estilos base en `src/styles/global.css`, anotaciones en `src/styles/refinements.css` y composición de las escenas en `src/styles/cinematic.css`.
- Preloader, patrocinadores, modales y ajustes responsive adicionales: `src/styles/experience-updates.css`.
- Entrada coordinada del hero: `src/scripts/hero-entrance.ts`. CTA de exploración y presentación blanca de Hidra: `src/styles/motion-polish.css`.
- Modelo editable: `src/lib/aeropress-model.ts`. Exportación portable en `public/models/aeropress-original.glb`.
- Coreografía pura y reversible: `src/lib/choreography.mjs`.
- Tramos de lectura, movimiento continuo del modelo y conversión entre scroll y capítulos: `src/lib/reading-pace.mjs`.
- Conservación de la posición al recargar y navegar por el historial: `src/lib/scroll-position.ts`.
- Escena, proyección de anotaciones y control de giro: `src/components/AeroScene.tsx`.
- Preparación interactiva: `src/components/BrewExperience.tsx`, geometría en `src/lib/brew-model.ts`, secuencia en `src/lib/brew-choreography.mjs` y estilos en `src/styles/brew.css`.
- Menú, modales y enlaces de consulta: `src/scripts/interactions.ts`.
- Carga inicial: `src/scripts/startup.ts`. Espera paisaje, fuentes, disposición de scroll y primer fotograma del modelo. Incluye entrada manual y salida de respaldo a los ocho segundos; sin JavaScript, el contenido queda visible.
- Viaje costa → producto, capítulos, transición de la isla, galería del equipo, navegación de escenas y modo de movimiento reducido: `src/scripts/motion.ts`.

La web genera la geometría localmente y evita descargar el GLB en la carga inicial. El GLB incluido se construyó aquí mediante código Three.js y se exportó con `GLTFExporter`: **no se descargó de una biblioteca, de 3D Jutsu ni del fabricante**. Conserva grupos semánticos independientes. La exportación aplica escala 0,05 para unidades en metros. Las imágenes estáticas proceden del mismo modelo.

La apertura y el despiece comparten un solo canvas. El scroll mueve el producto, la cámara ortográfica, el paisaje y el texto sobre una línea de tiempo común. Los cuatro botones permiten saltar directamente a cada capítulo. El giro manual se aplica en un grupo independiente. En escritorio, la costa se revela con una máscara y el equipo se recorre horizontalmente; en móvil, la galería usa scroll táctil nativo. La preferencia del sistema `prefers-reduced-motion` devuelve el documento a una disposición natural sin escenas fijadas. No hay un botón manual de movimiento.

La entrada inicial coordina paisaje, giro del producto, líneas del título y CTA. Sus capas son independientes de los elementos animados por scroll: al desplazarse se completa la entrada; al recargar en una sección posterior se omite. «Explora el método» funciona tanto al pulsar como al seguir desplazándose. El logo de Hidra se presenta blanco mediante CSS en patrocinadores y crédito, conservando intacto el PNG original.

El viaje principal ocupa 8,5 alturas de pantalla de scroll en escritorio y 7,5 en móvil. Cada capítulo tiene un tramo de lectura con texto quieto, mientras el modelo sigue una curva continua entre los mismos capítulos. El canvas mantiene su ciclo durante el movimiento y deja de renderizar en reposo. La posición se guarda en la entrada actual del historial y se restaura al preparar el scroll. La entrada presenta el logo, la línea de carga y una apertura de cortinas, sin círculo de fondo. En una recarga dentro de otra sección, la entrada se omite para conservar la lectura.

Al final del despiece, «Prepara tu café» abre una mesa 3D: montar filtro y base sobre la taza, añadir café, mantener pulsado para verter agua, remover, arrastrar el émbolo y servir. El líquido pasa de la cámara a la taza conforme avanza la presión. También funciona con teclado y controles táctiles, permite repetir y devuelve el foco y la posición de lectura al cerrar. Con movimiento reducido se omiten las transiciones automáticas; el agua y la presión siguen respondiendo a la acción del usuario.

La mesa se importa bajo demanda y reutiliza la fábrica del modelo RED. Su canvas adicional renderiza durante la interacción, se detiene en reposo y libera geometrías, materiales, texturas y entorno al cerrar. No descarga otro GLB. La secuencia es una simulación visual; sus duraciones no representan tiempos de infusión ni una receta calibrada.

La preparación incluye entradas y salidas de herramientas, trayectorias curvas del émbolo, mezcla circular, retirada de la base antes del desplazamiento lateral y acercamiento progresivo a la taza. Los gestos de agua y presión se suavizan visualmente; el render continúa mientras el líquido se asienta y se detiene al quedar en reposo. La lectura cambia con transiciones y repetir usa un fundido, sin rebobinar el café.

## Información y límites

El PDF suministrado describe la **edición 2025**, no una convocatoria de 2026. No se ha adelantado la fecha ni se anuncian inscripciones abiertas. Los CTA preparan una consulta por WhatsApp o correo y el usuario decide enviarla. No existe backend de registro.

El AeroPress es una reconstrucción paramétrica detallada de la referencia, **no CAD del fabricante ni una reproducción dimensional certificada**. Para cerrar una validación industrial de fidelidad se necesita un modelo oficial o medidas y fotografías de todas las caras del ejemplar concreto.

No se suministró una fotografía documental de la costa o de Rancho Victorio: el paisaje es una interpretación generada y se identifica como tal. Los retratos, el logotipo y el símbolo floral de RED proceden del PDF. No hay rostros generados.

La página conserva la información histórica de 2025 y permite indexación (`index, follow`). Antes de publicarla, establecer el dominio de producción y una URL absoluta para `og:image`.

Consulta [fuentes y decisiones de contenido](docs/fuentes.md), [recursos y prompts](docs/recursos.md) y [verificación](docs/verificacion.md).

## Verificación reproducible

Con el servidor de desarrollo activo, los scripts usan Playwright con Edge instalado:

```sh
node scripts/cinematic-qa.mjs
node scripts/cinematic-functional-qa.mjs
node scripts/performance-qa.mjs --native
```

Capturas e informes de esta revisión en `docs/qa/cinematic/`. La prueba visual captura 0, 15, 33, 50, 69 y 94 % del viaje, su recorrido inverso y las escenas secundarias en escritorio y móvil. La prueba funcional acepta `QA_URL` para verificar un servidor de producción. El exportador y las métricas de diagnóstico solamente se exponen en desarrollo.

Los scripts no envían mensajes ni completan inscripciones.

Las comprobaciones de la revisión de carga, patrocinadores y equipo están en `scripts/inspect-startup.mjs` (desarrollo), `scripts/experience-qa.mjs` y `scripts/scene-layout-qa.mjs` (preview en 4322). Guardan evidencia en `docs/qa/startup/` y `docs/qa/experience/`.

La revisión de lectura y recarga se reproduce con `scripts/reload-reading-qa.mjs` y `scripts/navigation-qa.mjs` contra el preview en 4322; aceptan `QA_URL`. `scripts/reading-layout-qa.mjs` captura los cuatro capítulos en pantallas pequeñas usando el servidor de desarrollo. Guardan evidencia en `docs/qa/reading/`. `npm test` incluye nueve pruebas de coreografía, tramos de lectura y continuidad del modelo. `scripts/smoothness-qa.mjs` mide el movimiento y la cadencia del canvas en desarrollo; admite `QA_WIDTH=390` para el viewport móvil y guarda resultados en `docs/qa/smoothness/`.


## Carga progresiva, móvil y Lighthouse · septiembre de 2026

La portada prepara HTML e imágenes desde el inicio. El preloader abre las cortinas al quedar preparado el documento y puede interrumpirse al comenzar a navegar. React y Three.js se importan al explorar el método; saltar desde el menú a otra sección evita esa carga. El espacio del recorrido se reserva antes de inicializar el scroll para mantener las imágenes inferiores fuera de la descarga crítica.

Las variantes de fotos, logos y recortes de patrocinadores están en `public/optimized/`. Se regeneran con `npm run images:optimize`; los originales se conservan. La portada móvil usa un recorte vertical de la misma costa. Los patrocinadores usan imágenes nativas con carga diferida y la cuadrícula pasa a dos columnas en teléfonos estrechos.

Auditoría reproducible contra una compilación de producción con Edge instalado:

```powershell
npm run build
# Servir dist con npm run preview -- --port 4322
$env:LH_LABEL='final'
$env:LH_RUNS='3'
$env:LH_ASSERT='1'
npm run test:lighthouse
```

El script usa los perfiles oficiales de Lighthouse para móvil y escritorio, caché fría y sus límites predeterminados. No modifica la página en función del auditor. Guarda JSON, HTML y resumen en `docs/qa/lighthouse/`. Requiere más de 90 en rendimiento, accesibilidad, buenas prácticas y SEO en cada pasada cuando `LH_ASSERT=1`.

El recorrido móvil y la carga bajo demanda se verifican con `scripts/mobile-performance-qa.mjs`. Las pruebas de hero, navegación y preparación siguen en sus scripts correspondientes. `scripts/fluid-qa.mjs` verifica que los efectos líquidos se asienten y dejen de renderizar al soltar los controles y al reiniciar.

## Referencias de accesorios y vertido

`output/tripo-references/referencias-red-coffee-club.zip` conserva las tres referencias visuales con la marca RED Coffee Club, sus prompts y el logo original. Se generaron con la herramienta integrada ImageGen.

Los accesorios se modelaron después directamente a partir de esas referencias, sin Tripo. `src/lib/brew-accessories.ts` define las paredes huecas y asas del vidrio, el pico abierto, la tapa y el cuenco de la cuchara. La misma geometría se usa en la web y se exporta a `output/models-red/` como GLB con texturas y materiales. El agua de la tetera y el café son objetos independientes. Una superficie de fondo dentro del renderer permite que el vidrio refracte el color de la escena, evitando el velo blanco del canvas transparente.

La preparación usa chorros con aceleración por gravedad y reducción de sección según el caudal. El nivel de la taza se calcula por volumen en un recipiente ensanchado; las superficies tienen ondas y normales animadas, y la extracción produce salpicaduras pequeñas. Es una simulación visual ligera con buffers reutilizados, sin solver volumétrico. Los efectos terminan cuando el líquido se asienta y respetan la preferencia de movimiento reducido.

La optimización inicial obtuvo **92/100/100/100 en móvil y 100/100/100/100 en escritorio** en tres pasadas por perfil (rendimiento/accesibilidad/buenas prácticas/SEO). La revisión posterior, con el preloader recuperado y los modelos propios, mantiene esos resultados en una nueva pasada por perfil. Condiciones y archivos completos en [el informe de Lighthouse](docs/qa/lighthouse/RESULTADOS.md), y [evidencia de los modelos y animaciones](docs/qa/accessories/VERIFICACION.md). Son mediciones locales de laboratorio; no datos de usuarios en producción.
