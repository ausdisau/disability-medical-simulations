'use strict';
const {app, BrowserWindow, session}=require('electron');
const path=require('node:path');
function launch(){
  const window=new BrowserWindow({width:1360,height:900,minWidth:840,minHeight:600,
    title:'AURA · Project Hope · Synthetic',
    webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true,allowRunningInsecureContent:false,webviewTag:false,
      preload:path.join(__dirname,'preload.cjs')}});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event)=>event.preventDefault());
  window.loadFile(path.resolve(__dirname,'../anzcor-react-web/dist/index.html'));
}
app.whenReady().then(()=>{
  session.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
  launch();
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)launch();});
