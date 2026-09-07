# Accesorios RED Coffee Club · modelos propios

Modelados directamente con Three.js a partir de las tres imágenes de `output/tripo-references/`, el 7 de septiembre de 2026. No proceden de Tripo. La geometría fuente está en `src/lib/brew-accessories.ts` y se utiliza directamente en la preparación interactiva de la web.

- `taza-cristal-red.glb`: taza hueca de vidrio, fondo con espesor, borde pulido, asa en D y logo original blanco.
- `tetera-vidrio-red.glb`: recipiente de vidrio, pico hueco con salida abierta, tapa y pomo separados, asa angular negra y logo blanco.
- `cuchara-red.glb`: cuenco cóncavo con espesor, borde redondeado y mango plano con el logo original.

Los GLB contienen la geometría, los materiales y la textura del logo. Usan las extensiones estándar de materiales de glTF para transmisión, índice de refracción y volumen del vidrio. La apariencia exacta depende de la iluminación y del soporte de materiales del visor.

La exportación usa metros: una unidad del rig equivale a 0,05 m, igual que el AeroPress existente. La tetera incluye una escala relativa de 1,35. Los recipientes se exportan vacíos; café y agua se animan como objetos separados en la web. El origen de la taza está en el centro del fondo; el de la tetera está en el eje del cuerpo; el de la cuchara está en el centro de la boca del cuenco.

Se conservan los manifiestos glTF como JSON para inspeccionar materiales, mallas, escalas y metadatos. No son planos de fabricación ni modelos CAD del fabricante.

## Reproducir

Con el servidor de desarrollo en `http://127.0.0.1:4323/`, ejecutar `node scripts/accessories-qa.mjs`. El script exporta los GLB, verifica que incluyen la marca y el material de transmisión, y guarda vistas frontales, posteriores y de tres cuartos en `docs/qa/accessories/`.
