const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({});vm.runInContext(fs.readFileSync('src/main/resources/static/js/animalScreen.js','utf8'),c);
const pairs=[{source:{x:10,y:10},target:{x:0,y:0}},{source:{x:110,y:10},target:{x:100,y:0}},{source:{x:10,y:210},target:{x:0,y:100}}];
const transform=c.erScreenAffine(pairs);assert.equal(transform({x:60,y:110}).x,50);assert.equal(transform({x:60,y:110}).y,50);
assert.equal(c.erScreenAffine([]),null);assert.equal(c.erScreenAffine(pairs.map((p,i)=>({...p,source:{x:i*10,y:i*10}}))),null);
const f={width:100,height:80,data:new Uint8ClampedArray(100*80*4)};
function marker(x,y){for(let j=0;j<16;j++)for(let i=0;i<16;i++){let k=((y+j)*f.width+x+i)*4;f.data[k]=i*15;f.data[k+1]=200-j*9;f.data[k+2]=(i+j)*7;f.data[k+3]=255;}}
marker(20,20);const patch=c.erScreenPatch(f,{x:28,y:28},16);f.data.fill(0);marker(60,40);
let found=c.erScreenLocate(f,{x:0,y:0,w:100,h:80},patch);assert.equal(found.x,68);assert.equal(found.y,48);
marker(20,20);assert.equal(c.erScreenLocate(f,{x:0,y:0,w:100,h:80},patch),null,'ambiguous matching icons must not select a player');
f.data.fill(0);assert.equal(c.erScreenLocate(f,{x:0,y:0,w:100,h:80},patch),null,'missing icon must not invent position');
assert.equal(c.erScreenPatch(f,{x:0,y:0},16),null);
assert.equal(c.erScreenClock('01:31\n'),91);assert.equal(c.erScreenClock('00:11'),11);
for(const text of ['01:60','1:9','131','abc 01:31','01:31 23','-1:31'])assert.equal(c.erScreenClock(text),null);
assert(c.erScreenClockContinuous(91,89,2));assert(!c.erScreenClockContinuous(91,110,2));assert(!c.erScreenClockContinuous(91,40,2));assert(!c.erScreenClockContinuous(91,89,10));
console.log('PASS: affine map calibration, degenerate anchors, moving template, ambiguity/loss rejection, strict clock parsing and discontinuities');
