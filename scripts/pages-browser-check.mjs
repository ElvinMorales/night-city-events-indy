// Optional local browser check: supply an existing Playwright installation.
// Serves only dist/ at the Pages subpath, without Vite's SPA fallback.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

assert(process.env.PLAYWRIGHT_MODULE, 'Set PLAYWRIGHT_MODULE to an installed playwright/index.mjs');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const root = path.resolve(import.meta.dirname, '..');
const base = '/night-city-events-indy/';
const directory = path.join(root, 'dist');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = path.resolve(directory, pathname.slice(base.length) || 'index.html');
  if (!pathname.startsWith(base) || !file.startsWith(directory + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ timezoneId: 'Asia/Tokyo' });
  const errors = [];
  const assets = new Set();
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(`Failed request: ${request.url()}`));
  page.on('response', response => {
    if (['script', 'stylesheet'].includes(response.request().resourceType())) {
      assets.add(response.url());
      if (!response.ok() || !response.url().startsWith(origin + base + 'assets/')) errors.push(`Invalid asset: ${response.status()} ${response.url()}`);
    }
  });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const suffix of ['', '?demo=1', '?demo=1#events']) {
      await page.goto('about:blank');
      const response = await page.goto(origin + base + suffix);
      assert.equal(response.status(), 200);
      await page.getByRole('heading', { name: 'Upcoming events' }).waitFor();
      assert.equal(await page.getByText('Development demo — fictional events.', { exact: true }).count(), 0);
      if (JSON.parse(fs.readFileSync(path.join(root, 'src/data/events.json'), 'utf8')).length === 0) {
        await page.getByText('Your next table is still taking shape', { exact: true }).waitFor();
        assert.equal(await page.locator('.event-card').count(), 0);
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page overflow');
      // CSS really loaded, rather than only returning a successful HTTP response.
      assert.equal(await page.locator('.content-grid').evaluate(element => getComputedStyle(element).display), width < 680 ? 'flex' : 'grid');
      await page.getByRole('button', { name: 'Calendar', exact: true }).click();
      await page.getByRole('button', { name: 'Next month' }).click();
      await page.getByRole('button', { name: 'List', exact: true }).click();
      await page.getByRole('button', { name: 'Submit an event', exact: true }).first().click();
      await page.getByRole('dialog').waitFor();
      await page.keyboard.press('Escape');
    }
  }
  for (const file of ['docs/review/events.candidates.json', 'docs/release-candidate/events.json', 'src/data/samples.json', 'src/data/events.json', '.git/config']) {
    assert.equal((await fetch(origin + base + file)).status, 404, `Source file exposed: ${file}`);
  }
  assert(assets.size >= 2, 'Expected JS and CSS requests');
  assert.deepEqual(errors, []);
  console.log(`Pages browser check passed: Chromium ${browser.version()}, desktop/mobile, normal/demo/hash URLs, CSS/JS, interactions, source-file 404s.`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
