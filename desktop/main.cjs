'use strict';
const {app,BrowserWindow,ipcMain,protocol,net,globalShortcut,Tray,Menu,nativeImage,desktopCapturer,session,screen}=require('electron');
const path=require('node:path'),{pathToFileURL}=require('node:url'),{assetPath,names}=require('./policy.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'ergg',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
let control,overlay,tray,quitting=false,editing=false,selectedSource=null,snapshot=null,lookupBusy=false;
const smoke=process.argv.includes('--smoke');
if(!app.requestSingleInstanceLock())app.quit();
else {
app.on('second-instance',()=>{control?.show();control?.focus();});
app.whenReady().then(async()=>{
 protocol.handle('ergg',request=>{const file=assetPath(__dirname,request.url);return file?net.fetch(pathToFileURL(file).href):new Response('Not found',{status:404});});
 const webPreferences={preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false};
 control=new BrowserWindow({width:1040,height:850,minWidth:740,minHeight:600,title:'ERGG 설정',backgroundColor:'#111827',webPreferences});
 const area=screen.getPrimaryDisplay().workArea;
 overlay=new BrowserWindow({width:360,height:650,minWidth:300,minHeight:400,x:area.x+area.width-380,y:area.y+30,frame:false,transparent:true,hasShadow:false,alwaysOnTop:true,skipTaskbar:true,focusable:false,webPreferences});
 overlay.setAlwaysOnTop(true,'screen-saver');overlay.setIgnoreMouseEvents(true,{forward:true});
 overlay.setContentProtection(true);
 for(const win of [control,overlay]){win.setMenuBarVisibility(false);if(smoke)win.webContents.on('console-message',(_e,details)=>console.log('renderer:',details));win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());}
 const isControl=e=>e.sender===control.webContents&&e.senderFrame?.url.startsWith('ergg://app/ui/index.html');
 const notify=()=>{for(const win of [control,overlay])win.webContents.send('mode',{editing,visible:overlay.isVisible()});};
 const edit=()=>{editing=!editing;overlay.setIgnoreMouseEvents(!editing,{forward:true});overlay.setFocusable(editing);if(editing){overlay.show();overlay.focus();}notify();};
 const toggle=()=>{overlay.isVisible()?overlay.hide():overlay.showInactive();notify();};
 const settings=()=>{control.show();control.focus();};
 ipcMain.handle('window-action',(e,action,value)=>{if(!isControl(e))throw Error('Denied');if(action==='edit')edit();else if(action==='toggle')toggle();else if(action==='quit'){quitting=true;app.quit();}else if(action==='opacity')overlay.setOpacity(Math.min(1,Math.max(.35,Number(value)||.9)));else if(action==='reset'){overlay.setBounds({x:area.x+area.width-380,y:area.y+30,width:360,height:650});}return {editing,visible:overlay.isVisible()};});
 ipcMain.on('snapshot',(e,data)=>{if(isControl(e)&&JSON.stringify(data).length<100000){snapshot=data;overlay.webContents.send('snapshot',snapshot);}});
 ipcMain.handle('snapshot-get',e=>e.sender===overlay.webContents?snapshot:null);
 ipcMain.handle('sources',async e=>{if(!isControl(e))throw Error('Denied');return (await desktopCapturer.getSources({types:['window','screen'],thumbnailSize:{width:0,height:0}})).filter(s=>!s.name.startsWith('ERGG')).map(s=>({id:s.id,name:s.name}));});
 ipcMain.handle('source-select',(e,id)=>{if(!isControl(e)||typeof id!=='string')throw Error('Denied');selectedSource=id;});
 session.defaultSession.setDisplayMediaRequestHandler(async(request,callback)=>{
  try{if(request.frame!==control.webContents.mainFrame||!selectedSource)return callback({});const sources=await desktopCapturer.getSources({types:['window','screen'],thumbnailSize:{width:0,height:0}});const source=sources.find(s=>s.id===selectedSource);callback(source?{video:source}:{});}catch(_){callback({});}
 });
 const cache=new Map();
 async function api(route){const response=await net.fetch('https://eternalreturngg.onrender.com'+route,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error('조회 서버 응답 오류');const body=await response.json();if(body.code!=null&&![0,200].includes(Number(body.code)))throw Error('플레이어 조회 실패');return body;}
 ipcMain.handle('team',async(e,input)=>{
  if(!isControl(e)||lookupBusy)throw Error('조회 중입니다. 잠시 기다려 주세요.');const requested=names(input);lookupBusy=true;
  try{return await Promise.all(requested.map(async nickname=>{
   const cached=cache.get(nickname);if(cached&&Date.now()-cached.at<60000)return cached.data;
   try{const found=await api('/er/search/nickname?nickname='+encodeURIComponent(nickname));const id=found.user?.userId;if(!id)throw Error('플레이어를 찾지 못했습니다.');
    const rank=await api('/er/userRank?userNum='+encodeURIComponent(id));const stats=rank.userStats?.[0]||null;
    const data={nickname:found.user.nickname||nickname,stats};cache.set(nickname,{at:Date.now(),data});return data;
   }catch(err){return {nickname,error:err.message};}
  }));}finally{lookupBusy=false;}
 });
 // Tray remains usable if a shortcut is taken by another program.
 const icon=nativeImage.createFromPath(path.join(__dirname,'ui/tray.png'));tray=new Tray(icon);tray.setToolTip('ERGG Overlay');tray.setContextMenu(Menu.buildFromTemplate([{label:'설정 열기',click:settings},{label:'오버레이 표시/숨기기',click:toggle},{label:'클릭 통과/편집 전환',click:edit},{type:'separator'},{label:'종료',click:()=>{quitting=true;app.quit();}}]));tray.on('double-click',settings);
 const failed=[];for(const [key,fn] of [['Control+Shift+F8',toggle],['Control+Shift+F9',edit],['Control+Shift+F10',settings]])if(!globalShortcut.register(key,fn))failed.push(key);
 control.on('close',e=>{if(!quitting){e.preventDefault();control.hide();}});
 overlay.on('close',e=>{if(!quitting){e.preventDefault();overlay.hide();notify();}});
 await Promise.all([control.loadURL('ergg://app/ui/index.html?view=settings'),overlay.loadURL('ergg://app/ui/index.html?view=overlay')]);notify();
 if(failed.length)control.webContents.send('warning','단축키 등록 실패: '+failed.join(', ')+' · 트레이 메뉴를 사용하세요.');
 if(smoke){await new Promise(r=>setTimeout(r,1800));const result=await control.webContents.executeJavaScript('({camps:document.querySelectorAll("#camp option").length,ready:!!window.overlayReady})');if(!result.ready||result.camps!==179)throw Error('Renderer smoke failed: '+JSON.stringify(result));edit();if(!overlay.isFocusable())throw Error('Edit mode failed');edit();if(overlay.isFocusable())throw Error('Click-through mode failed');console.log('PASS packaged app: local scheme, renderer, 179 camps, overlay edit mode');quitting=true;app.exit(0);}
}).catch(error=>{console.error(error);app.exit(1);});
app.on('before-quit',()=>{quitting=true;});app.on('will-quit',()=>globalShortcut.unregisterAll());
}
