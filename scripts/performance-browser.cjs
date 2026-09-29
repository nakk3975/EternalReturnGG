'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

// Keep these paths and ready selectors in sync with verify-site-pages.cjs.
const MENUS = [
  ['home', '/er/search/view', '.home-route'],
  ['leaderboard', '/er/leaderboard', '[data-rank-id]'],
  ['characters', '/er/characters', '#character-picker .character-choice'],
  ['statistics', '/er/statistics', '#stats-table tbody tr'],
  ['items', '/er/items', '#item-list tbody tr'],
  ['routes', '/er/routes', '.route-list-row'],
  ['route-planner', '/er/route-planner', '#planner-equipment-open:not([disabled])'],
  ['animal-map', '/er/animal-map', '#animal-points [data-add-camp]'],
  ['guide', '/er/guide', '.guide-card'],
  ['multi', '/er/multi', '#multi-form'],
  ['favorites', '/er/favorites', '#find-players']
];
function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return fallback;
  if (!process.argv[i + 1] || process.argv[i + 1].startsWith('--')) throw new Error('Missing --' + name + ' value');
  return process.argv[i + 1];
}
const baseUrl = arg('base-url', 'https://eternalreturngg.onrender.com').replace(/\/$/, '');
const runs = Number(arg('runs', '20'));
const output = arg('output', 'performance-report.json');
const renderCold = process.argv.includes('--render-cold');
const menu = arg('menu', '');
const targets = MENUS.filter(([name]) => !menu || name === menu);
if (!Number.isInteger(runs) || runs < 1 || (!renderCold && runs < 20 && process.argv.includes('--require-20'))) throw new Error('Invalid --runs');
if (!targets.length) throw new Error('Unknown menu: ' + menu);
if (renderCold && (targets.length !== 1 || runs !== 1)) throw new Error('Render cold requires --menu NAME --runs 1');
if (!/^https?:\/\//.test(baseUrl)) throw new Error('Invalid --base-url');

const round = n => Math.round(n * 100) / 100;
function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return round(sorted[Math.ceil(sorted.length * fraction) - 1]);
}
function summary(values) {
  return { count: values.length, p50Ms: percentile(values, .5), p95Ms: percentile(values, .95) };
}
function aggregate(samples) {
  const groups = {};
  for (const row of samples) (groups[row.menu + ':' + row.phase] ||= []).push(row);
  return Object.fromEntries(Object.entries(groups).map(([key, rows]) => {
    const successful = rows.filter(r => r.status === 'ok');
    const data = successful.flatMap(r => r.dataRequests.filter(x => x.status < 400 && !x.error).map(x => x.durationMs).filter(Number.isFinite));
    const byEndpoint = {};
    for (const r of rows) for (const x of r.dataRequests) {
      const endpoint = x.path.split('?')[0];
      (byEndpoint[endpoint] ||= []).push(x);
    }
    return [key, {
      attempts: rows.length, screenComplete: summary(successful.map(r => r.screenCompleteMs)),
      navigationResponse: summary(successful.map(r => r.navigationResponseMs).filter(Number.isFinite)),
      dataResponse: summary(data),
      dataByEndpoint: Object.fromEntries(Object.entries(byEndpoint).map(([path, requests]) => [path, {
        count: requests.length, duration: summary(requests.map(r => r.durationMs).filter(Number.isFinite)),
        errorRate: round(requests.filter(r => r.status >= 400 || r.error).length / requests.length)
      }])),
      pageFailureRate: round(rows.filter(r => r.status !== 'ok').length / rows.length),
      requestErrorRate: round(rows.filter(r => r.failedRequests.length).length / rows.length),
      underOneSecondRate: round(rows.filter(r => r.status === 'ok' && r.screenCompleteMs < 1000).length / rows.length)
    }];
  }));
}

async function measure(context, target, phase, iteration) {
  const [menu, path, readySelector] = target;
  const page = await context.newPage();
  const failedRequests = [], dataRequests = [], errors = [];
  let navigationResponseMs = null, status = 'ok', screenCompleteMs = null;
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', req => {
    const item = { path: new URL(req.url()).pathname, error: req.failure()?.errorText || 'request failed' };
    failedRequests.push(item);
    if (new URL(req.url()).origin === baseUrl && item.path.startsWith('/er/') && !req.isNavigationRequest()) dataRequests.push(item);
  });
  page.on('response', response => {
    const req = response.request(), url = new URL(response.url());
    if (url.origin !== baseUrl) return;
    if (response.status() >= 400) failedRequests.push({ path: url.pathname, status: response.status() });
    if (url.pathname.startsWith('/er/') && !req.isNavigationRequest()) {
      // Resource Timing supplies durations below after the response body finishes.
      dataRequests.push({ path: url.pathname + url.search, status: response.status(), resourceType: req.resourceType() });
    }
  });
  const started = performance.now();
  try {
    const response = await page.goto(baseUrl + path, { waitUntil: 'domcontentloaded', timeout: 90000 });
    if (!response?.ok()) throw new Error('Navigation HTTP ' + (response?.status() ?? 'unknown'));
    await page.locator(readySelector).first().waitFor({ state: 'visible', timeout: 25000 });
    // Visible, eager images only. Lazy images below the fold are not part of initial screen completion.
    await page.waitForFunction(() => [...document.images].filter(img => {
      const box = img.getBoundingClientRect();
      return box.width && box.height && box.top < innerHeight && box.bottom > 0;
    }).every(img => img.complete), null, { timeout: 15000 });
    screenCompleteMs = round(performance.now() - started);
  } catch (e) {
    status = 'failed'; errors.push(e.message);
    screenCompleteMs = round(performance.now() - started);
  }
  const timing = await page.evaluate(() => ({
    navigation: performance.getEntriesByType('navigation').map(n => ({ responseMs: n.responseEnd - n.requestStart }))[0],
    resources: performance.getEntriesByType('resource').map(r => ({ name: r.name, durationMs: r.duration }))
  })).catch(() => ({ navigation: null, resources: [] }));
  navigationResponseMs = timing.navigation?.responseMs ?? null;
  const durations = new Map();
  for (const r of timing.resources) {
    const list = durations.get(r.name) || [];
    list.push(round(r.durationMs)); durations.set(r.name, list);
  }
  for (const r of dataRequests) {
    const list = durations.get(baseUrl + r.path);
    r.durationMs = list?.shift() ?? null;
  }
  await page.close();
  return { menu, path, phase, iteration, status, screenCompleteMs, navigationResponseMs,
    dataRequests, failedRequests, errors };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const samples = [];
  const save = () => fs.writeFileSync(output, JSON.stringify({ measuredAt: new Date().toISOString(), baseUrl,
    definition: 'Fresh context cold; one warm-up then reused context warm. Ready selector and visible eager images; no forced network idle. Failed page samples excluded from latency percentile but included in rates.',
    renderIdleVerified: false, aggregates: aggregate(samples.filter(r => r.iteration > 0)), samples }, null, 2) + '\n');
  try {
    for (const target of targets) {
      if (renderCold) {
        const context = await browser.newContext({ serviceWorkers: 'block' });
        samples.push(await measure(context, target, 'render-idle-single', 1)); save(); await context.close();
        break;
      }
      for (let i = 1; i <= runs; i++) {
        const context = await browser.newContext({ serviceWorkers: 'block' });
        await context.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache', Pragma: 'no-cache' });
        samples.push(await measure(context, target, 'browser-cold', i)); save(); await context.close();
      }
      const context = await browser.newContext({ serviceWorkers: 'block' });
      samples.push(await measure(context, target, 'warm-up', 0)); save();
      for (let i = 1; i <= runs; i++) { samples.push(await measure(context, target, 'browser-warm', i)); save(); }
      await context.close();
      console.log(target[0], JSON.stringify(aggregate(samples.filter(r => r.iteration > 0))));
    }
  } finally { await browser.close(); save(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
