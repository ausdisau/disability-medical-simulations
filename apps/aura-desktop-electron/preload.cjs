'use strict';
const {contextBridge}=require('electron');
contextBridge.exposeInMainWorld('auraDesktop',Object.freeze({mode:'educational-synthetic-only',canConnectDevices:false}));
