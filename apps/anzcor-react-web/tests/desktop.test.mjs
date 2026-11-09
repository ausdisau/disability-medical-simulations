import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
test('Tauri is a wrapper around the canonical React build',()=>{
  const conf=JSON.parse(read('../../aura-desktop-tauri/src-tauri/tauri.conf.json'));
  assert.equal(conf.build.frontendDist,'../../anzcor-react-web/dist');
  assert.equal(conf.bundle.active,false);
  assert.match(conf.app.security.csp,/connect-src 'none'/);
});
test('Electron renderer is isolated and cannot navigate to arbitrary content',()=>{
  const main=read('../../aura-desktop-electron/main.cjs');
  assert.match(main,/sandbox:true/);assert.match(main,/contextIsolation:true/);assert.match(main,/nodeIntegration:false/);
  assert.match(main,/setWindowOpenHandler/);
});
test('desktop shell source does not grant device or network handlers',()=>{
  const main=read('../../aura-desktop-electron/main.cjs');const preload=read('../../aura-desktop-electron/preload.cjs');
  assert.doesNotMatch(main,/webviewTag:true|nodeIntegration:true|sandbox:false/);
  assert.match(preload,/canConnectDevices:false/);
});
