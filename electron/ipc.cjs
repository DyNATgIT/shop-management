const { ipcMain, dialog, BrowserWindow } = require('electron')
const db = require('./db.cjs')

function registerIpc() {

  ipcMain.handle('print:receipt-html', async (_event, html) => {
    const printWindow = new BrowserWindow({
      show: false,
      width: 420,
      height: 760,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    try {
      await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
      await new Promise(resolve => setTimeout(resolve, 500))
      return await new Promise(resolve => {
        printWindow.webContents.print({
          silent: false,
          printBackground: true,
          margins: { marginType: 'none' }
        }, (success, failureReason) => {
          if (!printWindow.isDestroyed()) printWindow.close()
          resolve({ ok: success, error: failureReason || '' })
        })
      })
    } catch (error) {
      if (!printWindow.isDestroyed()) printWindow.close()
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
  ipcMain.handle('db:get-app-state', () => db.getAppState())
  ipcMain.handle('db:set-app-state', (_event, state) => db.setAppState(state))
  ipcMain.handle('db:backup-database', () => db.backupDatabase())
  ipcMain.handle('db:ensure-daily-backup', () => db.ensureDailyBackup())
  ipcMain.handle('db:get-info', () => db.getInfo())
  ipcMain.handle('db:set-backup-dir', (_event, dir) => db.setBackupDir(dir))
  ipcMain.handle('db:reset-backup-dir', () => db.resetBackupDir())
  ipcMain.handle('db:choose-backup-dir', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose SQLite Backup Folder',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return null
    const selected = db.setBackupDir(result.filePaths[0])
    return selected
  })
}

module.exports = { registerIpc }
