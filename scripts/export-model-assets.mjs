import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';

await mkdir('docs/qa/branding', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [], renders = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto('http://127.0.0.1:4321', { waitUntil: 'networkidle' });
await page.waitForSelector('.product-canvas.is-ready');
await page.waitForTimeout(1500);
for (const [name, progress] of [['assembled', 0], ['exploded', 1]]) {
  await page.evaluate(progress => {
    const range = window.__aeroScroll;
    window.scrollTo({ top: range.start + (range.end - range.start) * progress, behavior: 'instant' });
  }, progress);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `docs/qa/branding/desktop-${name}.png` });
  // Export the transparent WebGL render, framed independently of the HTML scene.
  const png = await page.evaluate(() => {
    const source = document.querySelector('.product-canvas canvas');
    const scan = document.createElement('canvas');
    scan.width = source.width; scan.height = source.height;
    const scanContext = scan.getContext('2d'); scanContext.drawImage(source, 0, 0);
    const pixels = scanContext.getImageData(0, 0, scan.width, scan.height).data;
    let left = scan.width, top = scan.height, right = -1, bottom = -1;
    for (let y = 0; y < scan.height; y++) for (let x = 0; x < scan.width; x++) {
      if (pixels[(y * scan.width + x) * 4 + 3] > 4) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    if (right < left || bottom < top) throw new Error('Empty WebGL render');
    const width = right - left + 1, height = bottom - top + 1;
    const output = document.createElement('canvas'); output.width = 720; output.height = 1000;
    const scale = Math.min(660 / width, 920 / height);
    output.getContext('2d').drawImage(source, left, top, width, height, (720 - width * scale) / 2, (1000 - height * scale) / 2, width * scale, height * scale);
    return output.toDataURL('image/png');
  });
  renders.push({ name, buffer: Buffer.from(png.split(',')[1], 'base64') });
}
const glb = Buffer.from(await page.evaluate(() => window.__exportAeroPress()));
const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
assert.ok(json.nodes.some(node => node.name === 'RED_Coffee_Club_logo_and_1_to_4_markings'));
assert.ok(json.images.every(image => typeof image.bufferView === 'number'));
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://127.0.0.1:4321', { waitUntil: 'networkidle' });
await page.waitForSelector('.product-canvas.is-ready'); await page.waitForTimeout(1500);
await page.screenshot({ path: 'docs/qa/branding/mobile-assembled.png' });
await page.locator('.hero-scroll').click(); await page.waitForTimeout(1800);
await page.locator('[data-journey="0.94"]').click(); await page.waitForTimeout(1800);
await page.screenshot({ path: 'docs/qa/branding/mobile-exploded.png' });
assert.deepEqual(errors, []);
await browser.close();
// Write assets after closing the page to avoid dev-server reloads mid-export.
await writeFile('public/models/aeropress-original.glb', glb);
for (const { name, buffer } of renders) {
  await sharp(buffer).webp({ quality: 95, alphaQuality: 100 }).toFile(`public/images/aeropress-${name}.webp`);
}
const report = { errors, logo: '/images/logo.png', glbBytes: glb.length, embeddedImages: json.images.length, renderSize: '720 × 1000', views: ['desktop assembled', 'desktop exploded', 'mobile assembled', 'mobile exploded'] };
await writeFile('docs/qa/branding/report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
