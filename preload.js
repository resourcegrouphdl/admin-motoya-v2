const { contextBridge } = require('electron');
const { version } = require('./package.json');

contextBridge.exposeInMainWorld('appVersion', {
  get: () => version
});