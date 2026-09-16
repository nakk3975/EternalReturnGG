const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
 action:(action,value)=>ipcRenderer.invoke('window-action',action,value),
 sources:()=>ipcRenderer.invoke('sources'),selectSource:id=>ipcRenderer.invoke('source-select',id),
 team:names=>ipcRenderer.invoke('team',names),publish:data=>ipcRenderer.send('snapshot',data),
 snapshot:()=>ipcRenderer.invoke('snapshot-get'),
 onSnapshot:fn=>ipcRenderer.on('snapshot',(_e,data)=>fn(data)),
 onMode:fn=>ipcRenderer.on('mode',(_e,data)=>fn(data)),
 onWarning:fn=>ipcRenderer.on('warning',(_e,data)=>fn(data))
});
