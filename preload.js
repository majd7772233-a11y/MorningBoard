const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  saveLicenseKey: (key) => ipcRenderer.invoke('save-license-key', key),
  loadLicenseKey: () => ipcRenderer.invoke('load-license-key'),
  saveAlphabetWords: (words) => ipcRenderer.invoke('save-alphabet-words', words),
  loadAlphabetWords: () => ipcRenderer.invoke('load-alphabet-words'),
  startScreenCapture: () => ipcRenderer.send('start-screen-capture'),
  readClipboardImage: () => ipcRenderer.invoke('read-clipboard-image'),
  onScreenshotCaptured: (callback) => {
    ipcRenderer.removeAllListeners('screenshot-captured');
    ipcRenderer.on('screenshot-captured', (event, dataUrl) => callback(dataUrl));
  },
  focusWindow: () => ipcRenderer.send('focus-window'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  onInitCapture: (callback) => {
    ipcRenderer.removeAllListeners('init-capture');
    ipcRenderer.on('init-capture', (event, data) => callback(data));
  },
  cropCompleted: (dataUrl) => ipcRenderer.send('crop-completed', dataUrl),
  cropCancelled: () => ipcRenderer.send('crop-cancelled'),
  convertWebmToMp4: (data) => ipcRenderer.invoke('convert-webm-to-mp4', data),
  startRecordingStream: () => ipcRenderer.invoke('start-recording-stream'),
  writeRecordingChunk: (chunk) => ipcRenderer.send('write-recording-chunk', chunk),
  finishRecordingStream: (options) => ipcRenderer.invoke('finish-recording-stream', options),
  onIdleTrim: (callback) => {
    ipcRenderer.removeAllListeners('app-idle-trim');
    ipcRenderer.on('app-idle-trim', () => callback());
  },
  saveAppSetting: (key, val) => ipcRenderer.invoke('save-app-setting', key, val),
  loadAppSettings: () => ipcRenderer.invoke('load-app-settings'),
  getMicrosoftStoreProducts: () => ipcRenderer.invoke('get-microsoft-store-products'),
  buyMicrosoftStore: (storeId) => ipcRenderer.invoke('buy-microsoft-store', storeId),
  checkMicrosoftStoreLicense: () => ipcRenderer.invoke('check-microsoft-store-license')
});

