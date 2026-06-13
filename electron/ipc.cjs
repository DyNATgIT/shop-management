const { ipcMain, dialog } = require('electron')
const db = require('./db.cjs')

function registerIpc() {
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