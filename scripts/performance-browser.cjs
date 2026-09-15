'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const DEFAULT_BASE = 'https://eternalreturngg.onrender.com';
const MENUS = [
  ['home', '/er/search/view'],
  ['leaderboard', '/er/leaderboard'],
  ['characters', '/er/characters'],
  ['statistics', '/er/statistics'],
  ['items', '/er/items'],
  ['routes', '/er/routes'],
  ['route-planner', '/er/route-planner'],
  ['animal-map', '/er/animal-map'],
  ['guide', '/er/guide'],
  ['multi', '/er/multi'],
  ['favorites', '/er/favorites']
];

function option(name, fallback) {
  const index = process.argv.indexOf('--' + name);
  return index < 0 ? fallback : process.argv[index + 1];
}

const baseUrl = option('base-url', process.env.ER_PERF_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
const runs = Number(option('runs', process.env.ER_PERF_RUNS || '20'));
const output = option('output', process.env.ER_PERF_REPORT || 'performance-report.json');
const renderCold = process.argv.includes('--render-cold');
const headed = process.argv.includes('--headed');
const only = option('menu', '');
const targets = MENUS.filter(([name]) => !only || name === only);

if (!Number.isInteger(runs) || runs < 1) throw new Error('--runs must be a positive integer');
if (!targets.length) throw new Error('Unknown --menu. Use: ' + MENUS.map(x => x[0]).join(', '));

const round = value => Math.round(value * 100) / 100;
function percentile(values, ratio) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  return round(sorted[Math.ceil(sorted.length * ratio) - 1]);
}
function summary(values) {
  return { samples: values.length, p50Ms: percentile(values, .5), p95Ms: percentile(values, .95), minMs: values.length ? round(Math.min(...values)) : null, maxMs: values.length ? round(Math.max(...values)) : null };
}

async function waitForScreen(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForFunction(() => Array.from(document.images).every(img => img.complete), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(250);
}

async function measure(context, name, path, phase, iteration) {
  const page = await context.newPage();
  const failed = [];
  page.on('response', response => { if (response.status() >= 400) failed.push({ status: response.status(), url: response.url() }); });
  page.on('requestfailed', request => failed.push({ error: request.failure()?.errorText || 'request failed', url: request.url() }));
  const started = Date.now();
  let status = 'ok';
  let error;
  try {
    const response = await page.goto(baseUrl + path, { waitUntil: 'commit', timeout: 60000 });
    if (!response || !response.ok()) throw new Error('navigation HTTP ' + (response?.status() ?? 'unknown'));
    await waitForScreen(page);
  } catch (caught) {
    status = 'failed'; error = caught.message;
  }
  const screenCompleteMs = Date.now() - started;
  const timing = await page.evaluate(origin => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource').filter(x => x.name.startsWith(origin + '/er/') && !x.name.includes('/static/'));
    return {
      navigation: navigation ? {
        dnsMs: navigation.domainLookupEnd - navigation.domainLookupStart,
        connectMs: navigation.connectEnd - navigation.connectStart,
        tlsMs: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
        ttfbMs: navigation.responseStart - navigation.requestStart,
        responseMs: navigation.responseEnd - navigation.requestStart,
        domContentLoadedMs: navigation.domContentLoadedEventEnd,
        loadMs: navigation.loadEventEnd
      } : null,
      dataRequests: resources.map(x => ({ url: x.name.slice(origin.length), durationMs: x.duration, transferSize: x.transferSize }))
    };
  }, baseUrl).catch(() => ({ navigation: null, dataRequests: [] }));
  await page.close();
  return { name, path, phase, iteration, status, error, screenCompleteMs, ...timing, failedRequests: failed };
}

(async () => {
  const browser = await chromium.launch({ headless: !headed });
  const samples = [];
  if (renderCold) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    samples.push(await measure(context, targets[0][0], targets[0][1], 'render-after-15m-idle', 1));
    await context.close();
  } else {
    for (const [name, path] of targets) {
      for (let iteration = 1; iteration <= runs; iteration++) {
        const context = await browser.newContext({ serviceWorkers: 'block' });
        await context.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache', Pragma: 'no-cache' });
        samples.push(await measure(context, name, path, 'browser-cold', iteration));
        await context.close();
      }
      const context = await browser.newContext({ serviceWorkers: 'block' });
      await measure(context, name, path, 'warm-up-not-counted', 0);
      for (let iteration = 1; iteration <= runs; iteration++) samples.push(await measure(context, name, path, 'browser-warm', iteration));
      await context.close();
    }
  }
  await browser.close();
  const groups = {};
  for (const row of samples.filter(x => x.iteration > 0)) {
    const key = row.name + ':' + row.phase;
    (groups[key] ||= []).push(row);
  }
  const aggregates = Object.fromEntries(Object.entries(groups).map(([key, rows]) => [key, {
    screenComplete: summary(rows.filter(x => x.status === 'ok').map(x => x.screenCompleteMs)),
    navigationResponse: summary(rows.filter(x => x.status === 'ok' && x.navigation).map(x => x.navigation.responseMs)),
    dataResponse: summary(rows.filter(x => x.status === 'ok').flatMap(x => x.dataRequests.map(r => r.durationMs))),
    errorRate: round(rows.filter(x => x.status !== 'ok' || x.failedRequests.length).length / rows.length),
    underOneSecondRate: round(rows.filter(x => x.status === 'ok' && x.screenCompleteMs < 1000).length / rows.length)
  }]));
  const report = {
    measuredAt: new Date().toISOString(), baseUrl, runs, mode: renderCold ? 'render-cold-single-shot' : 'browser-cold-and-warm',
    definitions: {
      browserCold: 'Fresh browser context with request no-cache headers. This is not a stopped Render process.',
      browserWarm: 'Reused browser context after an uncounted warm-up navigation.',
      screenComplete: 'Navigation committed, DOMContentLoaded, network idle (or 30s cap), image completion (or 15s cap), then 250ms settle.',
      renderCold: 'One request only. Run after independently confirming at least 15 minutes without service traffic.'
    },
    aggregates, samples
  };
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.table(Object.entries(aggregates).map(([test, value]) => ({ test, screenP50: value.screenComplete.p50Ms, screenP95: value.screenComplete.p95Ms, apiP95: value.dataResponse.p95Ms, errorRate: value.errorRate, under1s: value.underOneSecondRate })));
  console.log('Report:', output);
})().catch(error => { console.error(error); process.exitCode = 1; });
