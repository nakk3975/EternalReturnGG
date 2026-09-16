const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
test('settings publishes route, manual death, reset and team rank without raw stats',async()=>{
 const root=path.resolve(__dirname,'..'),dom=new JSDOM(fs.readFileSync(path.join(root,'ui/index.html'),'utf8'),{url:'https://app/ui/index.html?view=settings',runScripts:'outside-only'}),w=dom.window;
 let last;w.desktop={publish:d=>last=d,onMode(){},onWarning(){},action:async()=>{},sources:async()=>[],selectSource:async()=>{},team:async()=>[{nickname:'tester',stats:{mmr:2000,totalGames:10}}]};
 Object.defineProperty(w,'desktop',{configurable:false});
 w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){}});w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.load=()=>{};
 for(const name of ['siteData','routePlanner','animalMap','animalTimer','animalScreen'])vm.runInContext(fs.readFileSync(path.join(root,'static/js',name+'.js'),'utf8'),dom.getInternalVMContext());
 vm.runInContext(fs.readFileSync(path.join(root,'ui/renderer.js'),'utf8'),dom.getInternalVMContext());
 const q=id=>w.document.getElementById(id);assert.equal(q('camp').options.length,179);assert(w.overlayReady);
 q('recommend').click();assert(last.route.length>0);q('camp').value='Chicken:0';q('kill').click();assert(last.timers.some(t=>t.remaining===120));
 q('new-match').click();assert.equal(last.timers.length,0);assert.equal(last.route.length,0);
 q('names').value='tester';await q('team-form').onsubmit({preventDefault(){},target:q('team-form')});assert.match(last.team[0].rank,/2000|2,000/);assert.equal(last.team[0].stats,undefined);
 dom.window.close();
});
