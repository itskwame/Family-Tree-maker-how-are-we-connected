import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const destination = 'output/phase2b';
async function verifyPhotos(page) {
  const results = await page.locator('image[data-photo]').evaluateAll(async images => Promise.all(images.map(async element => {
    const img = new Image();
    img.src = element.getAttribute('href');
    await img.decode();
    const clipId = element.getAttribute('clip-path').slice(5, -1);
    const circle = document.getElementById(clipId)?.querySelector('circle');
    return {
      decoded: img.naturalWidth >= 600 && img.naturalHeight > 0,
      ratio: element.getAttribute('preserveAspectRatio'),
      correctFrame: circle?.getAttribute('r') === '32' && element.getAttribute('width') === '64' && element.getAttribute('height') === '64',
    };
  })));
  expect(results).toHaveLength(8);
  for (const r of results) expect(r).toEqual({ decoded: true, ratio: 'xMidYMin slice', correctFrame: true });
}
test.beforeEach(async ({ page }) => {
  // The prototype is self-contained; inherited font/CDN requests are unnecessary.
  await page.route(/fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr/, route => route.abort());
  await page.goto('/#/tree-prototype');
  await expect(page.locator('[data-person]')).toHaveCount(25);
});
test('desktop: actual rendered cards, portraits, connectors and offline exports', async ({ page, browser }) => {
  await fs.mkdir(destination, { recursive: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await expect(page.locator('[data-initials]')).toHaveCount(25);
  await expect(page.locator('[data-photo]')).toHaveCount(8);
  await verifyPhotos(page);
  await expect(page.locator('[data-crossover]')).toHaveCount(1);
  const visual = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-person]')];
    const viewport = document.querySelector('[data-testid=interactive-tree]').getBoundingClientRect();
    const overlaps = [], clipped = [], textOverflow = [];
    cards.forEach((card, i) => {
      const r = card.querySelector('rect').getBoundingClientRect();
      if (r.left < viewport.left || r.right > viewport.right || r.top < viewport.top || r.bottom > viewport.bottom) clipped.push(card.dataset.person);
      cards.slice(i + 1).forEach(other => {
        const b = other.querySelector('rect').getBoundingClientRect();
        if (r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top) overlaps.push([card.dataset.person, other.dataset.person]);
      });
      card.querySelectorAll('text').forEach(text => {
        const box = text.getBoundingClientRect();
        if (box.left < r.left || box.right > r.right || box.top < r.top || box.bottom > r.bottom) textOverflow.push(card.dataset.person);
      });
    });
    return { overlaps, clipped, textOverflow };
  });
  expect(visual).toEqual({ overlaps: [], clipped: [], textOverflow: [] });
  await page.screenshot({ path: `${destination}/01-interactive-desktop.png`, fullPage: true });
  await page.getByRole('button', { name: 'Show connection' }).click();
  await expect(page.getByRole('heading', { name: 'First cousins', exact: true })).toBeVisible();
  // Two sibling paths share their common ancestor's junction inlet.
  await expect(page.locator('[data-highlighted=true]')).toHaveCount(7);
  await expect(page.getByLabel('Evidence path').locator('option')).toHaveCount(2);
  await page.screenshot({ path: `${destination}/02-cousin-connection.png`, fullPage: true });
  await page.getByRole('button', { name: 'Print studio', exact: true }).click();
  await expect(page.getByTestId('print-svg').locator('[data-person]')).toHaveCount(25);
  await verifyPhotos(page);
  const coverage = await page.getByTestId('print-svg').evaluate(el => {
    const graph = el.querySelector('[data-print-graph]').getBBox(), page = el.viewBox.baseVal;
    return { width: graph.width / page.width, height: graph.height / page.height };
  });
  expect(coverage.width).toBeGreaterThan(.90);
  expect(coverage.height).toBeGreaterThan(.68);
  await fs.writeFile(`${destination}/page-coverage.json`, JSON.stringify(coverage, null, 2));
  await page.screenshot({ path: `${destination}/03-print-studio.png`, fullPage: true });
  await page.getByTestId('print-svg').screenshot({ path: `${destination}/04-minimalist-preview.png` });
  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SVG' }).click();
  await (await svgDownload).saveAs(`${destination}/familyconnect-25-portraits.svg`);
  const svg = await fs.readFile(`${destination}/familyconnect-25-portraits.svg`, 'utf8');
  expect((svg.match(/href="data:image\/jpeg;base64,/g) || []).length).toBe(8);
  expect(svg).not.toContain('href="/family-portraits/');
  const dimensions = await page.getByTestId('print-svg').evaluate(el => ({ width: Math.ceil(el.viewBox.baseVal.width), height: Math.ceil(el.viewBox.baseVal.height) }));
  const offlineContext = await browser.newContext({ offline: true, viewport: dimensions });
  const standalone = await offlineContext.newPage();
  await standalone.goto(pathToFileURL(resolve(`${destination}/familyconnect-25-portraits.svg`)).href);
  await expect(standalone.locator('[data-person]')).toHaveCount(25);
  await verifyPhotos(standalone);
  await standalone.screenshot({ path: `${destination}/08-standalone-svg.png` });
  await offlineContext.close();
  const pdfDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();
  await fs.mkdir('output/pdf', { recursive: true });
  await (await pdfDownload).saveAs('output/pdf/familyconnect-25-portraits.pdf');
  await page.getByLabel('Paper size').selectOption('a4');
  await expect(page.getByRole('button', { name: 'Download PDF' })).toBeDisabled();
  await expect(page.getByText(/too wide for readable names/)).toBeVisible();
  expect(errors).toEqual([]);
});
test('mobile: no document overflow, search and zoom, half-sibling path', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator('[data-person]')).toHaveCount(25);
  await expect.poll(async () => page.locator('[data-person=emma]>rect').evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(140);
  await page.screenshot({ path: `${destination}/05-mobile-default.png`, fullPage: true });
  await page.getByLabel('Focus relative', { exact: true }).selectOption('arthur');
  const arthur = await page.locator('[data-person=arthur]>rect').boundingBox();
  expect(arthur.x).toBeGreaterThan(0);
  expect(arthur.x + arthur.width).toBeLessThan(390);
  await page.getByLabel('Search people').fill('Emma');
  await page.getByRole('button', { name: 'Emma Bennett 1984' }).click();
  const beforeZoom = await page.locator('[data-testid=interactive-tree]>g').getAttribute('transform');
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  expect(await page.locator('[data-testid=interactive-tree]>g').getAttribute('transform')).not.toBe(beforeZoom);
  await page.getByLabel('Second person', { exact: true }).selectOption('leo');
  await page.getByRole('button', { name: 'Show connection' }).click();
  await expect(page.getByRole('heading', { name: 'Half-siblings', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${destination}/05-mobile.png`, fullPage: true });
  await page.getByRole('button', { name: 'View branch', exact: true }).click();
  await expect(page.locator('[data-person]')).toHaveCount(4);
  await expect.poll(async () => page.locator('[data-person]>rect').evaluateAll(rects => rects.every(rect => {
    const box = rect.getBoundingClientRect(), viewport = document.querySelector('[data-testid=interactive-tree]').getBoundingClientRect();
    return box.width > 100 && box.left >= viewport.left && box.right <= viewport.right && box.top >= viewport.top && box.bottom <= viewport.bottom;
  }))).toBe(true);
  await page.screenshot({ path: `${destination}/07-mobile-branch.png`, fullPage: true });
});
test('branch collapse and expand, selection, and multiple relationship evidence', async ({ page }) => {
  await page.getByLabel('Branch root').selectOption('emma');
  await expect(page.locator('[data-person]')).toHaveCount(4);
  await page.getByLabel('Branch direction').selectOption('ancestors');
  await expect(page.locator('[data-person]')).toHaveCount(9);
  await page.getByRole('button', { name: 'Expand complete family' }).click();
  await expect(page.locator('[data-person]')).toHaveCount(25);
  const surface = page.getByTestId('interactive-tree'), box = await surface.boundingBox();
  const beforePan = await surface.locator(':scope > g').getAttribute('transform');
  await page.mouse.move(box.x + 40, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 100, { steps: 8 });
  await page.mouse.up();
  expect(await surface.locator(':scope > g').getAttribute('transform')).not.toBe(beforePan);
  await page.getByRole('button', { name: 'Fit tree', exact: true }).click();
  await page.getByLabel('First person', { exact: true }).selectOption('sophie');
  await page.getByLabel('Second person', { exact: true }).selectOption('noah');
  await page.getByRole('button', { name: 'Show connection' }).click();
  await expect(page.getByLabel('Evidence path').locator('option')).toHaveCount(3);
  await page.getByLabel('Evidence path').selectOption('2');
  await expect(page.getByRole('heading', { name: 'Partners', exact: true })).toBeVisible();
  await expect(page.locator('[data-highlighted=true]')).toHaveCount(2);
});
test('failed photograph falls back to initials in the actual SVG component', async ({ page }) => {
  await page.evaluate(async () => {
    const { mountBrokenPortrait } = await import('/tests/family/browser/portrait-harness.jsx');
    mountBrokenPortrait();
  });
  await expect(page.locator('[data-initials=broken]')).toHaveText('TP');
  await expect(page.locator('[data-photo=broken]')).toHaveCount(0);
});
