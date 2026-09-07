# Inventario y producción

## Recursos de la web

La mesa de preparación de `src/lib/brew-model.ts` reutiliza el AeroPress paramétrico existente y construye localmente la taza de vidrio, hervidor, cuchara, mezclador, café y agua. La taza usa el logo oficial RED ya disponible. No incorpora imágenes generadas nuevas ni modelos descargados. La secuencia se contrastó con las instrucciones oficiales de AeroPress: [How to use](https://aeropress.com/pages/how-to-use). Se anima como experiencia visual, con tiempos abreviados y sin proponer una receta de cantidades o temperatura.

| Archivo en public/ | Origen y tratamiento |
| --- | --- |
| images/logo.png | Imagen oficial incrustada en página 1 del PDF. Se elimina únicamente margen alfa vacío; se conservan sus píxeles visibles. |
| images/flower.png | Símbolo floral oficial incrustado en página 1. Mismo recorte de margen transparente. |
| images/hernan.webp, yoshio.webp | Extracción de las columnas fotográficas de página 5 renderizada a 1600 px. Encuadres de 387 × 387 px, sin generación ni modificación de identidad. |
| images/andres.webp, luis.webp | Extracción equivalente de página 6. Escala de grises aplicada en CSS, reversible al pasar el puntero. |
| images/margarita-coast.webp | Imagen generada con la herramienta integrada ImageGen, guiada por la referencia del usuario. Interpretación escénica, no fotografía documental de Guarame. 1536 × 1024 px; aproximadamente 286 KB. |
| images/coffee-macro.webp | Fotografía macro generada con ImageGen. 1536 × 1024 px; aproximadamente 121 KB. |
| images/coffee-botanical.webp | Ilustración botánica generada con transparencia, exportada a WebP. No sustituye al símbolo floral oficial. |
| images/aeropress-assembled.webp | Render con alfa del canvas del hero, desde la geometría y materiales de la web. |
| images/aeropress-exploded.webp | Render del mismo modelo en el estado completamente abierto. |
| models/aeropress-original.glb | Exportación local de la reconstrucción paramétrica personalizada con el logo oficial de RED Coffee Club. Grupos Chamber, Plunger_with_silicone_seal, Paper_microfilter y Perforated_filter_cap. Aproximadamente 1,20 MB. |
| documents/alianza-red.pdf | Copia sin modificar del documento del usuario. Aproximadamente 44,7 MB. Solo se descarga al solicitarlo. |

Las imágenes de café, cerezas y producto extraídas para el inventario también se conservan en public/images como fuentes auxiliares; no se solicitan al abrir la página. Los originales del PDF y las páginas renderizadas se conservaron en tmp/pdfs durante el trabajo.

La fotografía del hero se generó antes de construir su composición: mar y montaña como fondo, zona tranquila para tipografía a la izquierda y pedestal de roca a la derecha. El producto, el texto, las anotaciones y los controles son elementos independientes.

## Prompts finales · ImageGen integrado

### Costa

Create a single cinematic landscape background asset for a premium coffee competition website. Reference image is STYLE AND COMPOSITION REFERENCE ONLY: recreate the scenery behind the large central hero, absolutely no UI, no text, no AeroPress or coffee product, no lettering, no frame, no logo. Wide 3:2 image. Caribbean coastal mountains evoking Margarita island at late golden hour, muted warm brown rugged mountains receding from left to right, quiet steel teal ocean bay, a few tiny palms, warm hazy pale peach sky in upper 25%. In foreground a richly detailed dark brown weathered stone ledge spans bottom 22%, with a prominent flat rocky pedestal near 74% horizontal / 80% vertical that can support a digitally overlaid product. Left half uncluttered ocean and shadowed coast for white typography. Moody chiaroscuro, subtle analog grain, warm film color grading, realistic natural light from upper left, high end editorial travel photography. This is an artistic interpretation, not documentary of any specific real beach. Do not copy any text, product, diagrams or panels from reference. Produce only the full bleed scenic photograph.

### Macro

A finished editorial macro photograph of freshly roasted coffee beans for a dark cinematic specialty coffee website. Horizontal 3:2 composition, extreme close-up of three richly detailed glossy dark brown coffee beans on the RIGHT HALF, razor sharp crevices and subtle warm reflected highlights, beans further back heavily out of focus, very shallow depth of field. LEFT HALF nearly black negative space for a white headline. Warm side light, deep charcoal and espresso palette, subdued golden brown highlights, expensive analog photography. No text, no logos, no borders, no cups, no graphic elements.

### Botánica

Single antique botanical illustration of a Coffea arabica branch, isolated on an actual transparent background. Tall 2:3 composition. Fine hand engraved linework, desaturated olive gray leaves with delicate veins, a few muted burgundy red coffee cherries. A gracefully curved branch enters from bottom right and rises toward upper center, with 6 elongated naturally curled leaves. Nineteenth century natural history plate style, subtle watercolor pigments, highly intricate realistic botanical texture. No words, no labels, no borders, no paper background, no shadows outside the botanical object. Muted elegant palette suitable for overlay on warm ivory paper in a premium editorial coffee website.

## Tipografía

### Recursos suministrados en la revisión de patrocinadores

- `src/assets/sponsors/`: 26 PNG originales de la [carpeta de Drive suministrada](https://drive.google.com/drive/folders/1Ql69e1_fSjIiic0g25cLv9Fa2SghbPlM). Se utilizan 24 marcas: se omiten el isotipo alternativo de Aillio, ya representado por su logo completo, y RED como organizador. Los originales se conservan sin modificar; Astro produce versiones WebP y las ventanas SVG eliminan solo margen transparente, con espacio libre alrededor de cada marca. Inventario de archivos, IDs de Drive, dimensiones y límites visibles en `docs/source-assets/sponsors-drive.json`; revisión conjunta en `sponsors-contact-sheet.png` de la misma carpeta.
- `public/images/sponsors-source.png`: captura compartida anteriormente, conservada para Kofy y el sello junto a Mediterráneo, que no aparecen en el Drive. Ambos mantienen sus ventanas SVG y la separación del fondo por luminancia. Los perfiles de Instagram proceden de la captura; las cuentas con logo pasan al enlace de su marca. Proyecto ARSH permanece al pie.
- El usuario pidió conservar las marcas cuyos nombres aportará después. Esos sellos mantienen descripciones neutrales en el código; no se atribuyeron nombres inventados ni jerarquías de patrocinio.
- `public/images/hidra-logo.png`: copia del logo dorado existente en `../animation-web/public/assets/hidra/logo.png`, usado para el crédito «Hecho por Hidra» y, por petición expresa del usuario, en la sección de patrocinadores. No se añade un dominio no confirmado.

El sello de Laura Sofía Marcano se identificó mediante su original. Se conserva la descripción neutral de la cafetera «32», cuyo archivo se llama `PHOTO-W.png`. La sección reúne 27 marcas: 24 del Drive, dos del cartel e Hidra. Los dos recortes restantes conservan las limitaciones de resolución de la captura.

Instrument Serif (titulares, con cursivas puntuales), Manrope (lectura y navegación), Caveat (acentos manuscritos). Archivos WOFF2 locales a través de Fontsource; no se hace una petición a Google Fonts al visitar la página. Las licencias se incluyen en los respectivos paquetes.

## Técnica 3D

El rótulo del cuerpo lleva el logo original de RED Coffee Club de `images/logo.png`, colocado directamente como textura sobre la superficie curva y conservando sus proporciones. Sustituye al rótulo AeroPress del modelo; se mantiene la numeración 1–4. El GLB y ambos respaldos WebP se regeneran con `node scripts/export-model-assets.mjs`, con el servidor de desarrollo activo.

**Procedencia del GLB:** fue construido localmente con geometría paramétrica en `src/lib/aeropress-model.ts` y exportado mediante el `GLTFExporter` de Three.js. No es un archivo obtenido del fabricante, de 3D Jutsu, Sketchfab ni de otra biblioteca. La página genera esa geometría directamente; el GLB es una exportación portable. La similitud visual se apoya en las referencias suministradas y no implica medidas exactas ni autoría del fabricante.

Cámara ortográfica con inclinación leve, perfiles torneados huecos con grosor y labios, soporte hexagonal extruido con abertura, sello de silicona, nervios internos, cierre de bayoneta, 56 relieves de agarre y base con 37 perforaciones geométricas. Rótulo curvado y numeración 1–4, filtro de papel con fibras. Las piezas no cambian de geometría durante el scroll.

El plástico utiliza transparencia alfa y reflejos de entorno. Esta decisión permite ver el fondo fotográfico a través de la pieza y evita el coste de un pase de transmisión refractiva. Es una aproximación visual; no simula físicamente la refracción del polipropileno.

La geometría no procede de un escaneo ni del CAD del fabricante. El archivo editable permite sustituirlo por uno oficial conservando los grupos semánticos y la coreografía. No se declara equivalencia fotográfica o dimensional exacta con el producto físico.
