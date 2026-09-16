const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {assetPath,names}=require('../policy.cjs');
test('only app UI/static resources can be loaded',()=>{
 const root=path.resolve('/bundle');assert.equal(assetPath(root,'ergg://app/ui/index.html?view=settings'),path.join(root,'ui/index.html'));
 for(const url of ['https://example.com/ui/index.html','ergg://evil/ui/index.html','ergg://app/main.cjs','ergg://app/ui/%2e%2e%2fmain.cjs','ergg://app/ui/a%5c..%5cmain.cjs'])assert.equal(assetPath(root,url),null,url);
});
test('team input is bounded and deduplicated',()=>{assert.deepEqual(names([' abc ','abc','def']),['abc','def']);for(const input of [[],['a','b','c','d'],[''],[1],['x'.repeat(41)]])assert.throws(()=>names(input));});
