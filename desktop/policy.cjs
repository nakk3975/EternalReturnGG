const path=require('node:path');
function assetPath(root,url){
 const u=new URL(url);if(u.protocol!=='ergg:'||u.hostname!=='app')return null;
 const p=decodeURIComponent(u.pathname);if(p.split('/').includes('..')||p.includes('\\')||p.includes('\0'))return null;
 if(!p.startsWith('/ui/')&&!p.startsWith('/static/'))return null;
 const target=path.resolve(root,'.'+p);return target.startsWith(path.resolve(root)+path.sep)?target:null;
}
function names(input){if(!Array.isArray(input)||input.length<1||input.length>3)throw Error('닉네임은 1~3명까지 입력하세요.');return [...new Set(input.map(n=>{if(typeof n!=='string'||!n.trim()||n.length>40)throw Error('닉네임을 확인하세요.');return n.trim();}))];}
module.exports={assetPath,names};
