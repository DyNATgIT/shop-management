const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktopApp', {
  platform: process.platform,
  isDesktop: true,
  getAppState: () => ipcRenderer.invoke('db:get-app-state'),
  setAppState: (state) => ipcRenderer.invoke('db:set-app-state', state),
  backupDatabase: () => ipcRenderer.invoke('db:backup-database'),
  getDatabaseInfo: () => ipcRenderer.invoke('db:get-info')
})
