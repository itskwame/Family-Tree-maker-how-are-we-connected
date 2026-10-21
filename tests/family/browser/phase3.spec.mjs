import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const out = 'output/phase3';
const url = '/?family=100#/tree-prototype';

test.beforeEach(async ({ page }) => {
  await fs.mkdir(out, { recursive: true });
  await page.route(/fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr/, route => route.abort());
});
async function photos(page) {
  const result = await page.locator('[data-photo]').evaluateAll(async images => Promise.all(images.map(async el => {
    const image = new Image(); image.src = el.getAttribute('href'); await image.decode();
    return image.naturalWidth >= 600 && image.naturalHeight > 0 && el.getAttribute('preserveAspectRatio') === 'xMidYMin slice';
  })));
  expect(result).toHaveLength(8); expect(result.every(Boolean)).toBe(true);
}
test('100-person desktop, evidence paths, browser metrics and standalone exports', async ({ page, browser }) => {
  test.setTimeout(120000);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    window.__longTasks = [];
    new PerformanceObserver(list => window.__longTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true });
  });
  const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable');
  const started = performance.now();
  await page.goto(url);
  await expect(page.locator('[data-person]')).toHaveCount(100);
  await expect.poll(() => page.evaluate(() => window.__familyMetrics?.people)).toBe(100);
  const readyWallMs = performance.now() - started;
  await photos(page);
  expect(await page.locator('[data-person]').evaluateAll(nodes => new Set(nodes.map(n => n.dataset.person)).size)).toBe(100);
  expect(await page.locator('[data-person]').evaluateAll(nodes => nodes.filter(n => !n.querySelector('[data-photo]')).length)).toBe(92);
  await expect(page.locator('[data-adoptive]')).toHaveCount(1);
  await expect(page.locator('[data-crossover]')).toHaveCount(26);
  const visual = await page.locator('[data-person]').evaluateAll(nodes => {
    const viewport = document.querySelector('[data-testid=interactive-tree]').getBoundingClientRect();
    const clipped = [], textOverflow = [];
    for (const n of nodes) {
      const box = n.querySelector('rect').getBoundingClientRect();
      if (box.left < viewport.left || box.right > viewport.right || box.top < viewport.top || box.bottom > viewport.bottom) clipped.push(n.dataset.person);
      for (const text of n.querySelectorAll('text')) {
        const b = text.getBoundingClientRect();
        if (b.left < box.left || b.right > box.right || b.top < box.top || b.bottom > box.bottom) textOverflow.push(n.dataset.person);
      }
    }
    return { clipped, textOverflow };
  });
  expect(visual).toEqual({ clipped: [], textOverflow: [] });
  await page.screenshot({ path: `${out}/01-complete-desktop.png`, fullPage: true });
  const initialMetrics = await page.evaluate(() => window.__familyMetrics);
  const cdpBefore = await cdp.send('Performance.getMetrics');
  await page.getByLabel('First person', { exact: true }).selectOption('emma');
  await page.getByLabel('Second person', { exact: true }).selectOption('b1-aaa');
  const relationshipStarted = performance.now();
  await page.getByRole('button', { name: 'Show connection', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'First cousins, twice removed', exact: true })).toBeVisible();
  const relationshipWallMs = performance.now() - relationshipStarted;
  await expect(page.getByLabel('Evidence path').locator('option')).toHaveCount(4);
  for (const evidence of ['0', '1', '2', '3']) {
    await page.getByLabel('Evidence path').selectOption(evidence);
    expect(await page.locator('[data-highlighted]').count()).toBeGreaterThan(0);
  }
  await page.getByLabel('Evidence path').selectOption('0');
  expect(await page.locator('[data-edge]').evaluateAll(edges => {
    const firstActive = edges.findIndex(e => e.hasAttribute('data-highlighted'));
    return firstActive >= 0 && edges.slice(firstActive).every(e => e.hasAttribute('data-highlighted'));
  })).toBe(true); // Shared family buses must not paint gray over the highlighted route.
  await page.screenshot({ path: `${out}/02-distant-relationship.png`, fullPage: true });
  await page.getByRole('button', { name: 'Fit connection', exact: true }).click();
  await expect.poll(() => page.locator('[data-person=emma]>rect').evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(70);
  await page.screenshot({ path: `${out}/02-relationship-focused.png`, fullPage: true });
  await expect.poll(() => page.locator('[data-person=emma]>rect').evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(70);
  // Measure animation-frame intervals while d3 handles real wheel events.
  await page.evaluate(() => {
    window.__frames = []; window.__sampling = true;
    let last;
    const frame = now => { if (last) window.__frames.push(now - last); last = now; if (window.__sampling) requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  });
  const canvas = page.getByTestId('interactive-tree'), box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 20; i++) await page.mouse.wheel(0, i < 10 ? -50 : 50);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 30, { steps: 20 }); await page.mouse.up();
  const frameIntervals = await page.evaluate(() => { window.__sampling = false; return window.__frames; });
  await page.getByRole('button', { name: 'Print studio', exact: true }).click();
  await expect(page.getByTestId('print-svg').locator('[data-person]')).toHaveCount(100);
  await photos(page);
  await expect(page.getByText(/Names print at approximately 12.0 pt/)).toBeVisible();
  await page.screenshot({ path: `${out}/04-print-studio.png`, fullPage: true });
  const exports = {};
  for (const type of ['SVG', 'PDF', 'PNG']) {
    const start = performance.now(), download = page.waitForEvent('download');
    await page.getByRole('button', { name: `Download ${type}`, exact: true }).click();
    const file = await download;
    const path = type === 'PDF' ? 'output/pdf/familyconnect-100-portraits.pdf' : `${out}/familyconnect-100-portraits.${type.toLowerCase()}`;
    await file.saveAs(path);
    exports[type] = { wallMs: performance.now() - start, bytes: (await fs.stat(path)).size };
  }
  const svg = await fs.readFile(`${out}/familyconnect-100-portraits.svg`, 'utf8');
  expect((svg.match(/href="data:image\/jpeg;base64,/g) || []).length).toBe(8);
  expect(svg).not.toContain('href="/family-portraits/');
  const dimensions = await page.getByTestId('print-svg').evaluate(el => ({ width: Math.ceil(el.viewBox.baseVal.width), height: Math.ceil(el.viewBox.baseVal.height) }));
  const offline = await browser.newContext({ offline: true, viewport: dimensions });
  const standalone = await offline.newPage();
  await standalone.goto(pathToFileURL(resolve(`${out}/familyconnect-100-portraits.svg`)).href);
  await expect(standalone.locator('[data-person]')).toHaveCount(100); await photos(standalone);
  // Inspect at one SVG unit per pixel; physical print dimensions remain in the downloaded file.
  await standalone.locator('svg').evaluate(el => { el.setAttribute('width', el.viewBox.baseVal.width); el.setAttribute('height', el.viewBox.baseVal.height); });
  await standalone.screenshot({ path: `${out}/08-standalone-svg.png` });
  await offline.close();
  await page.getByLabel('Paper size').selectOption('a2');
  await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeDisabled();
  const cdpAfter = await cdp.send('Performance.getMetrics');
  await fs.writeFile(`${out}/browser-metrics.json`, JSON.stringify({
    browser: browser.version(), viewport: page.viewportSize(), readyWallMs, initialMetrics, relationshipWallMs,
    frameIntervalsMs: frameIntervals, exports, cdpBefore: cdpBefore.metrics, cdpAfter: cdpAfter.metrics,
    longTasks: await page.evaluate(() => window.__longTasks),
    note: 'Local dev server, headless desktop Chrome; timings include automation overhead. JS heap is not total browser memory. Long tasks include main-thread ELK and export work.',
  }, null, 2));
  expect(errors).toEqual([]);
});
test('search, zoom, pan, branches, adoption and unknown parentage', async ({ page }) => {
  await page.goto(url); await expect(page.locator('[data-person]')).toHaveCount(100);
  await page.getByLabel('Search people').fill('Milo Morgan');
  await page.getByRole('button', { name: 'Milo Morgan 2020' }).click();
  await expect(page.getByLabel('First person', { exact: true })).toHaveValue('b1-aaa');
  const rect = await page.locator('[data-person=b1-aaa]>rect').boundingBox();
  expect(rect.width).toBeGreaterThan(140); expect(rect.x).toBeGreaterThan(0);
  const group = page.locator('[data-testid=interactive-tree]>g'), before = await group.getAttribute('transform');
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  expect(await group.getAttribute('transform')).not.toBe(before);
  const canvas = await page.getByTestId('interactive-tree').boundingBox(), panBefore = await group.getAttribute('transform');
  await page.mouse.move(canvas.x + 60, canvas.y + 100); await page.mouse.down();
  await page.mouse.move(canvas.x + 140, canvas.y + 120, { steps: 8 }); await page.mouse.up();
  expect(await group.getAttribute('transform')).not.toBe(panBefore);
  await page.getByLabel('Branch root').selectOption('b1-a');
  await expect(page.locator('[data-person]')).toHaveCount(6);
  await page.screenshot({ path: `${out}/03-selected-branch.png`, fullPage: true });
  await page.getByLabel('Branch direction').selectOption('ancestors');
  await expect(page.locator('[data-person]')).toHaveCount(9);
  await page.getByRole('button', { name: 'Expand complete family', exact: true }).click();
  await expect(page.locator('[data-person]')).toHaveCount(100);
  await page.getByLabel('First person', { exact: true }).selectOption('b2-b');
  await page.getByLabel('Second person', { exact: true }).selectOption('b2-bb');
  await page.getByRole('button', { name: 'Show connection', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Connection through adoptive parentage', exact: true })).toBeVisible();
  await expect(page.locator('[data-adoptive][data-highlighted]')).toHaveCount(1);
  await page.getByLabel('First person', { exact: true }).selectOption('b3-ba');
  await page.getByLabel('Second person', { exact: true }).selectOption('b3-bb');
  await page.getByRole('button', { name: 'Show connection', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Siblings; full or half is not established', exact: true })).toBeVisible();
});
test('mobile starts with a readable complete branch, search changes branch, overview remains available', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await expect(page.locator('[data-person]')).toHaveCount(4);
  await expect(page.getByLabel('Branch root')).toHaveValue('emma');
  const readable = () => page.locator('[data-person]>rect').evaluateAll(rects => rects.every(rect => {
    const box = rect.getBoundingClientRect(), v = document.querySelector('[data-testid=interactive-tree]').getBoundingClientRect();
    return box.width > 100 && box.left >= v.left && box.right <= v.right && box.top >= v.top && box.bottom <= v.bottom;
  }));
  await expect.poll(readable).toBe(true);
  await page.screenshot({ path: `${out}/05-mobile-default.png`, fullPage: true });
  await page.getByLabel('Search people').fill('Milo Morgan');
  await page.getByRole('button', { name: 'Milo Morgan 2020' }).click();
  await expect(page.locator('[data-person]')).toHaveCount(1);
  await expect.poll(readable).toBe(true);
  await page.getByLabel('Focus relative', { exact: true }).selectOption('b1-aa');
  await expect(page.locator('[data-person]')).toHaveCount(3);
  await expect.poll(readable).toBe(true);
  await page.screenshot({ path: `${out}/05-mobile-navigation.png`, fullPage: true });
  await page.getByRole('button', { name: 'Expand complete family', exact: true }).click();
  await expect(page.locator('[data-person]')).toHaveCount(100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

