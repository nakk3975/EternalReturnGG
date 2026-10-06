'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('scripts/performance-browser.cjs', 'utf8').split('(async () => {')[0];
function harness(argv = [], env = {}) {
    const context = {require: name => name === 'playwright' ? {} : require(name), process: {argv, env}, URL,
        performance: {now: () => 100, getEntriesByType: type => type === 'navigation' ? [{
            domainLookupStart: 1, domainLookupEnd: 4, connectStart: 4, connectEnd: 12,
            secureConnectionStart: 6, requestStart: 12, responseStart: 30, responseEnd: 40,
            domContentLoadedEventEnd: 45, loadEventEnd: 0
        }] : [{name: 'https://example.test/er/weapon', duration: 28, transferSize: 1200}]}};
    vm.createContext(context); vm.runInContext(source, context); return context;
}
const config = harness(['--runs', '3', '--headed'], {ER_PERF_BASE_URL:'https://example.test/', ER_PERF_RUNS:'9', ER_PERF_REPORT:'custom.json'});
assert.equal(vm.runInContext('baseUrl', config), 'https://example.test');
assert.equal(vm.runInContext('runs', config), 3);
assert.equal(vm.runInContext('output', config), 'custom.json');
assert.equal(vm.runInContext('headed', config), true);
assert.throws(() => harness(['--render-cold']), /Render cold requires/);
const c = harness([], {ER_PERF_BASE_URL:'https://example.test'});
const samples = [10, 20, 30].map(ms => ({menu:'home', phase:'browser-cold', status:'ok', screenCompleteMs:ms,
    navigationResponseMs:ms, dataRequests:[], failedRequests:[]}));
samples.push({menu:'home', phase:'browser-cold', status:'failed', screenCompleteMs:99999,
    dataRequests:[], failedRequests:[{error:'timeout'}]});
const summary = c.aggregate(samples)['home:browser-cold'];
assert.equal(summary.screenComplete.minMs, 10); assert.equal(summary.screenComplete.maxMs, 30);
assert.equal(summary.screenComplete.p95Ms, 30); assert.equal(summary.pageFailureRate, .25);
assert.equal(c.summary([]).minMs, null); assert.equal(c.summary([]).maxMs, null);
(async () => {
    const handlers = {};
    const request = {url:()=> 'https://example.test/er/weapon', isNavigationRequest:()=>false, resourceType:()=> 'fetch'};
    const placeholder = {url:()=> 'https://example.test/static/images/asset-placeholder.svg', failure:()=>({errorText:'net::ERR_ABORTED'})};
    const page = {
        on:(name, handler)=>{handlers[name]=handler;},
        goto: async()=>{handlers.requestfailed(placeholder); handlers.response({request:()=>request,url:request.url,status:()=>200}); return {ok:()=>true};},
        locator:()=>({first:()=>({waitFor:async()=>{}})}), waitForFunction:async()=>{},
        evaluate:async fn => fn(),
        close:async()=>handlers.requestfailed({...request, failure:()=>({errorText:'net::ERR_ABORTED'})})
    };
    const result = await c.measure({newPage:async()=>page}, ['home','/er/search/view','.home-route'], 'browser-cold', 1);
    assert.equal(result.navigation.dnsMs, 3); assert.equal(result.navigation.tlsMs, 6);
    assert.equal(result.navigation.ttfbMs, 18); assert.equal(result.navigationResponseMs, 28);
    assert.equal(result.navigation.domContentLoadedMs, 45); assert.equal(result.navigation.loadMs, 0);
    assert.equal(result.dataRequests[0].durationMs, 28); assert.equal(result.dataRequests[0].transferSize, 1200);
    assert.equal(result.failedRequests.length, 0, 'placeholder and teardown cancellations stay excluded');
    console.log('PASS: diagnostic timing, transfer size, env/CLI precedence, successful-only extrema and cancellation corrections');
})().catch(error=>{console.error(error);process.exitCode=1;});
