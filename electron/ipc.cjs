const { ipcMain } = require('electron')
const db = require('./db.cjs')

function registerIpc() {
  ipcMain.handle('db:get-app-state', () => db.getAppState())
  ipcMain.handle('db:set-app-state', (_event, state) => db.setAppState(state))
  ipcMain.handle('db:backup-database', () => db.backupDatabase())
  ipcMain.handle('db:get-info', () => db.getInfo())
}

module.exports = { registerIpc }
