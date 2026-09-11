const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = {document:{addEventListener(){}}, erAssetBase:'https://example.test/'};
vm.createContext(context);
for (const file of ['siteData.js','player.js']) vm.runInContext(fs.readFileSync('src/main/resources/static/js/'+file,'utf8'),context);
assert.equal(context.erKda({}), '—');
assert.equal(context.erKda({playerDeaths:0,playerKill:3,playerAssistant:2}), 'PERFECT');
assert.equal(context.erKda({playerDeaths:2,playerKill:3,playerAssistant:2}), '2.5');
const row={gameId:123,gameRank:1,nickname:'<script>alert(1)</script>',equipment:{0:101101,1:202202},characterNum:1};
const card=context.erPlayerCard(row);
assert(card.includes('aria-expanded="false"'));
assert(card.includes('id="game-123"'));
assert.equal((card.match(/class="item-slot[" ]/g)||[]).length,5);
assert(!context.erPlayerCard(row,true).includes('<script>'));
console.log('PASS: missing KDA is unknown, zero deaths is perfect, cards collapsed, five equipment slots, names escaped');
assert.match(context.erRp({matchingMode:3,mmrAfter:10823,mmrGain:-21}),/10,823.*-21/);
assert.equal(context.erRp({matchingMode:2,mmrAfter:9999,mmrGain:100}),'—');
assert.equal(context.erRoute({routeIdOfStart:0}),'비공개');
assert.equal(context.erRoute({}),'—');
assert.equal(context.erRoute({routeIdOfStart:13838}),'13838');
const games=[
 {gameId:2,matchingMode:3,seasonId:41,mmrAfter:10823,mmrGain:-21,startDtm:'2026-09-11T07:42:00Z'},
 {gameId:1,matchingMode:3,seasonId:41,mmrAfter:10844,mmrGain:23,startDtm:'2026-09-11T07:12:00Z'},
 {gameId:3,matchingMode:2,seasonId:41,mmrAfter:0,startDtm:'2026-09-11T08:00:00Z'},
 {gameId:4,matchingMode:3,seasonId:40,mmrAfter:15000,startDtm:'2026-09-01T08:00:00Z'},
 {gameId:5,matchingMode:3,seasonId:41,mmrAfter:null,startDtm:'2026-09-11T09:00:00Z'}
];
assert.equal(JSON.stringify(context.erRpPoints(games,41).map(r=>r.gameId)),'[1,2]');
assert.match(context.erRpGraph(games,41),/조회한 랭크 2경기/);
assert(!context.erRpGraph(games,41).includes('NaN'));
assert(!context.erRpGraph([games[0]],41).includes('NaN'));
assert.match(context.erPersonalDetails({...row,traitFirstCore:7000401}),/data-trait="7000401"/);
console.log('PASS: ranked-only RP, private routes, chronological same-season graph, missing fields and single point');
