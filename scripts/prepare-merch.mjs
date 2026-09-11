import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Usage: node scripts/prepare-merch.mjs "directory containing the supplied PNGs"
// Delivery conversion only: preserve the full canvas, artwork and alpha channel.
const source = process.argv[2];
if (!source) throw new Error('Provide the directory containing the original merch PNGs.');
const pairs = ['WHITE RCx', 'BLACK RCx', 'BLUE RCx', 'BEIGE AP', 'BEIGE APx', 'RED APx'];
await mkdir('public/images/merch', { recursive: true });
const files = [];
for (const pair of pairs) {
  for (const side of ['FRONT', 'BACK']) {
    const original = `${pair} ${side}.png`;
    const file = `${pair.toLowerCase().replaceAll(' ', '-')}-${side.toLowerCase()}.webp`;
    const result = await sharp(path.join(source, original))
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 88, alphaQuality: 100, effort: 6 })
      .toFile(`public/images/merch/${file}`);
    files.push({ original, file, width: result.width, height: result.height, bytes: result.size });
  }
}
await writeFile('docs/source-assets/merch-supplied.json', JSON.stringify({ files }, null, 2) + '\n');
console.log(`${files.length} supplied views optimized: ${files.reduce((total, file) => total + file.bytes, 0)} bytes.`);
