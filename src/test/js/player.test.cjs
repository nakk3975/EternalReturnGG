const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = {document:{addEventListener(){}}, erAssetBase:'https://example.test/'};
vm.createContext(context);
for (const file of ['siteData.js','weaponMetadata.js','player.js']) vm.runInContext(fs.readFileSync('src/main/resources/static/js/'+file,'utf8'),context);
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
assert.equal(JSON.stringify(context.erRpPoints(games,41,Date.parse("2026-09-11T12:00:00Z")).map(r=>r.gameId)),'[1,2]');
assert.match(context.erRpGraph(games,41,Date.parse("2026-09-11T12:00:00Z")),/조회한 랭크 2경기/);
assert(!context.erRpGraph(games,41,Date.parse("2026-09-11T12:00:00Z")).includes('NaN'));
assert(!context.erRpGraph([games[0]],41).includes('NaN'));
assert.match(context.erPersonalDetails({...row,traitFirstCore:7000401}),/data-trait="7000401"/);
console.log('PASS: ranked-only RP, private routes, chronological same-season graph, missing fields and single point');

const tier = (mmr,rank=2000,totalGames=1) => context.erTier({mmr,rank,totalGames});
for (const [base,step,name] of [[0,150,'아이언'],[600,200,'브론즈'],[1400,250,'실버'],[2400,300,'골드'],[3600,350,'플래티넘'],[5000,350,'다이아몬드'],[6400,300,'메테오라이트']]) {
    ['IV','III','II','I'].forEach((division,i)=>{
        assert.equal(tier(base+step*i).name,name+' '+division);
        assert.equal(tier(base+step*(i+1)-1).name,name+' '+division);
    });
}
assert.equal(tier(7600).name,'미스릴');
assert.equal(tier(8299,1).name,'미스릴');
assert.equal(tier(8300,300).name,'이터니티');
assert.equal(tier(8300,301).name,'데미갓');
assert.equal(tier(8300,1000).name,'데미갓');
assert.equal(tier(8300,1001).name,'미스릴');
assert.equal(tier(9000,0).name,'미스릴');
for (const rp of [null,undefined,'',NaN,-1]) assert.equal(tier(rp),null);
assert.equal(tier(0,0,0),null);
console.log('PASS: all 28 lower-tier division boundaries, Mythril, top ranks and unranked');
const placements=Array.from({length:30},(_,i)=>({gameRank:i%8+1,matchingMode:3}));
assert.equal((context.erPlacementHtml(placements).match(/<span/g)||[]).length,20);
assert.equal(context.erPlacementHtml(placements,'2'),'');
(async()=>{
    let calls=0, fail=false;
    context.erRequest=async()=>{calls++;if(fail)throw new Error('temporary');return {userGames:[],next:null};};
    const pages=context.erMatchPages('test-player');
    const first=pages(123);
    assert.equal(pages(123),first);
    await first;
    await pages(123);
    assert.equal(calls,1);
    fail=true;
    await assert.rejects(pages(456));
    fail=false;
    await pages(456);
    assert.equal(calls,3);
    console.log('PASS: 20 placement limit, mode filter, shared prefetch and failed-page retry');
})().catch(error=>{console.error(error);process.exitCode=1;});

assert.equal(context.erMostPlayed([{characterCode:1,usages:159},{characterCode:2,usages:53}],[{characterNum:2}]),1);
assert.equal(context.erMostPlayed([],[{characterNum:2},{characterNum:1},{characterNum:2}]),2);
assert.equal(context.erMostPlayed([],[]),null);
assert.equal(context.erMostPlayed([{characterCode:1,usages:0}],[{characterNum:2}]),2);
console.log('PASS: most-used season character, recent fallback, missing records');

const boundaryGames=['2026-09-04T14:59:59Z','2026-09-04T15:00:00Z','2026-09-11T12:01:00Z'].map((startDtm,i)=>({gameId:i,matchingMode:3,seasonId:41,mmrAfter:1000,startDtm}));
assert.equal(JSON.stringify(context.erRpPoints(boundaryGames,41,Date.parse('2026-09-11T12:00:00Z')).map(r=>r.gameId)),'[1]');
assert.equal(context.erOwnTeam({teamNumber:2},{teamNumber:2}),true);
assert.equal(context.erOwnTeam({teamNumber:2},{teamNumber:3}),false);
assert.equal(context.erOwnTeam({},{}),false);
assert.equal(context.erOwnPlayer({userId:'a'},{userId:'b'}),false);
assert.match(context.erPlayerCard(row,true,true),/own-player/);
console.log('PASS: KST seven-day boundaries, future exclusion, team and own-player identity');
assert.equal(context.erBossBadges({killAlphaGainVFCredit:100}), '');
assert.equal(context.erBossBadges({killMonsters:{7:0,8:null,9:-1}}), '');
assert.match(context.erBossBadges({killMonsters:{7:1,8:2,9:1}}), /위클라인.*알파 ×2.*오메가/);
const scoreboard=context.erTeamScoreboard([[{...row,teamNumber:1,killMonsters:{8:1}}, {...row,nickname:'ally',teamNumber:1}, {...row,nickname:'ally2',teamNumber:1}]], {...row,teamNumber:1});
assert.equal((scoreboard.match(/rowspan="3"/g)||[]).length,1);
assert.equal((scoreboard.match(/class="boss-badge boss-alpha"/g)||[]).length,1);
assert.match(scoreboard,/우리 팀/);
assert(!scoreboard.includes('<script>'));
assert(!scoreboard.includes('NaN'));
console.log('PASS: shared team rank cell, per-player boss kills only, escaped names and missing fields');
assert.match(context.erScorePlayerLink({nickname:'한 글&name'}), /href="\/er\/user\/detail\/view\?nickname=%ED%95%9C%20%EA%B8%80%26name"/);
assert.match(context.erScorePlayerLink({nickname:'name',userId:'a/b'}), /userNum=a%2Fb/);
assert(!context.erScorePlayerLink({nickname:'name'}).includes('<button'));
console.log('PASS: native player anchors support new tabs and encode nickname/ID parameters');

assert.equal(context.erMatchDate('2026-09-11T20:24:55.055+0900'),'09/11 20:24');
assert.equal(context.erMatchDate('2026-09-11T23:30:00Z'),'09/12 08:30');
assert.equal(context.erMatchDate('bad'),'—');
assert.equal(context.erMatchDate(null),'—');
const skillNames=new Map([['Skill/Group/Name/3015100','단검 평타'],['Skill/Group/Name/3018010','쌍검 기본 공격'],['Skill/Group/Name/3015000','망토와 단검']]);
const learning=context.erLearnedSkills({1:3015100,2:1037200,3:3018010,4:3015000},skillNames);
assert.equal(JSON.stringify(learning),JSON.stringify([['2',1037200],['4',3015000]]));
assert.equal(context.erIsAvailableTactical({active:true,equipWithStart:true,modeType:'1,2,3,5,6'}),true);
assert.equal(context.erIsAvailableTactical({active:false,equipWithStart:true,modeType:'3'}),false);
assert.equal(context.erIsAvailableTactical({active:true,equipWithStart:false,modeType:4}),false);
assert.equal(context.erIsAvailableTactical({active:true,equipWithStart:true,modeType:'3'},'6'),false);
console.log('PASS: basic attacks removed without removing weapon skills or renumbering; tactical availability uses API flags and mode');
