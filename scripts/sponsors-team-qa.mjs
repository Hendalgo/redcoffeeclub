import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const folder = 'docs/qa/sponsors-originals';
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
const errors = [], results = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto((process.env.QA_URL || 'http://127.0.0.1:4322') + '/#patrocinadores');
    await page.waitForFunction(() => document.querySelector('.preloader').hidden);
    await page.locator('.sponsors-grid').evaluate(element => scrollBy({ top: element.getBoundingClientRect().top - innerHeight * .45, behavior: 'instant' }));
    await page.waitForTimeout(2100);
    const assets = await page.locator('.sponsor-art').evaluateAll(async elements => Promise.all(elements.map(async element => {
      const url = element.matches('img') ? element.src : element.querySelector('image').href.baseVal;
      const image = new Image(); image.src = url; await image.decode();
      return { name: element.parentElement.getAttribute('aria-label'), source: element.dataset.source, url, loaded: image.naturalWidth > 0 };
    })));
    assert.equal(assets.length, 27);
    assert.equal(assets.filter(asset => asset.source === 'drive').length, 24);
    assert.equal(assets.filter(asset => asset.source === 'poster').length, 2);
    assert.ok(assets.every(asset => asset.loaded));
    assert.equal(new Set(assets.map(asset => asset.name)).size, 27);
    assert.equal(assets.filter(asset => asset.name === 'Hidra').length, 1);
    assert.equal(await page.locator('.sponsor-mark[aria-label="Laura Sofía Marcano"]').getAttribute('href'), 'https://www.instagram.com/laurasofiamarcano/');
    assert.equal(await page.locator('.sponsors-community a').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#patrocinadores').screenshot({ path: `${folder}/${viewport.width}-sponsors.png` });

    const names = await page.locator('.team-person h3').allTextContents();
    assert.deepEqual(names, ['Yoshio Kayo', 'Andrés García', 'Luis Tovar', 'Hernán Velásquez']);
    await page.locator('#equipo').evaluate(element => scrollTo({ top: element.getBoundingClientRect().top + scrollY, behavior: 'instant' }));
    await page.waitForTimeout(1300);
    assert.equal(await page.locator('[data-team-count]').textContent(), '01 / 04');
    await page.screenshot({ path: `${folder}/${viewport.width}-team-first.png` });
    for (let index = 2; index <= 4; index++) {
      await page.locator('[data-team-step="1"]').click();
      await page.waitForFunction(count => document.querySelector('[data-team-count]').textContent === count, `0${index} / 04`);
      await page.waitForTimeout(850);
    }
    assert.ok(await page.locator('[data-team-step="1"]').isDisabled());
    await page.screenshot({ path: `${folder}/${viewport.width}-team-last.png` });
    const centers = await page.locator('.team-controls button').evaluateAll(elements => elements.map(element => {
      const button = element.getBoundingClientRect(), icon = element.querySelector('svg').getBoundingClientRect();
      return [Math.abs(button.x + button.width / 2 - icon.x - icon.width / 2), Math.abs(button.y + button.height / 2 - icon.y - icon.height / 2)];
    }));
    assert.ok(centers.every(([x, y]) => x < .6 && y < .6));
    results.push({ viewport, assets, names, centers });
    await page.close(); console.log('PASS sponsors and team', viewport);
  }
  assert.deepEqual(errors, []);
  await writeFile(`${folder}/report.json`, JSON.stringify({ results, errors }, null, 2));
} finally { await browser.close(); }
