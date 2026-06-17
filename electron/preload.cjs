const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktopApp', {
  platform: process.platform,
  isDesktop: true,
  getAppState: () => ipcRenderer.invoke('db:get-app-state'),
  setAppState: (state) => ipcRenderer.invoke('db:set-app-state', state),
  backupDatabase: () => ipcRenderer.invoke('db:backup-database'),
  ensureDailyBackup: () => ipcRenderer.invoke('db:ensure-daily-backup'),
  getDatabaseInfo: () => ipcRenderer.invoke('db:get-info'),
  chooseBackupDir: () => ipcRenderer.invoke('db:choose-backup-dir'),
  setBackupDir: (dir) => ipcRenderer.invoke('db:set-backup-dir', dir),
  resetBackupDir: () => ipcRenderer.invoke('db:reset-backup-dir'),
  printReceiptHtml: (html) => ipcRenderer.invoke('print:receipt-html', html)
})
