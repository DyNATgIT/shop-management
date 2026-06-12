const { app } = require('electron')
const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')

let db

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function getBaseDir() {
  return path.join(app.getPath('documents'), 'Vegetable Shop Manager')
}

function getDataDir() {
  return path.join(getBaseDir(), 'data')
}

function getBackupDir() {
  return path.join(getBaseDir(), 'backups')
}

function getDbPath() {
  return path.join(getDataDir(), 'shop.db')
}

function getTodayStamp() {
  return new Date().toISOString().slice(0, 10)
}

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

function listBackups() {
  ensureDir(getBackupDir())
  return fs.readdirSync(getBackupDir())
    .filter(name => name.endsWith('.db'))
    .map(name => ({
      name,
      path: path.join(getBackupDir(), name),
      mtimeMs: fs.statSync(path.join(getBackupDir(), name)).mtimeMs
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
}

function getLastBackup() {
  return listBackups()[0] || null
}

function hasBackupForToday() {
  const today = getTodayStamp()
  return listBackups().some(file => file.name.includes(today))
}

function getDb() {
  if (db) return db
  ensureDir(getDataDir())
  ensureDir(getBackupDir())
  db = new Database(getDbPath())
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)
  db.prepare('INSERT OR IGNORE INTO sync_meta (key, value) VALUES (?, ?)').run('schema_version', '1')
  return db
}

function getAppState() {
  const row = getDb().prepare('SELECT value FROM app_state WHERE key = ?').get('main')
  if (!row) return null
  try {
    return JSON.parse(row.value)
  } catch {
    return null
  }
}

function setAppState(state) {
  const value = JSON.stringify(state)
  const updatedAt = new Date().toISOString()
  getDb().prepare(`
    INSERT INTO app_state (key, value, updated_at)
    VALUES ('main', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(value, updatedAt)
  return { ok: true, updatedAt }
}

function backupDatabase(prefix = 'shop') {
  const source = getDbPath()
  ensureDir(getBackupDir())
  if (!fs.existsSync(source)) getDb()
  const target = path.join(getBackupDir(), `${prefix}-${getTimestamp()}.db`)
  // Ensure WAL changes are checkpointed before copy.
  getDb().pragma('wal_checkpoint(FULL)')
  fs.copyFileSync(source, target)
  return target
}

function ensureDailyBackup() {
  getDb()
  const state = getAppState()
  if (!state) return { created: false, reason: 'no-state-yet', path: null, lastBackup: getLastBackup() }
  if (hasBackupForToday()) return { created: false, reason: 'already-exists', path: null, lastBackup: getLastBackup() }
  const backupPath = backupDatabase(`auto-${getTodayStamp()}`)
  return { created: true, reason: 'created', path: backupPath, lastBackup: getLastBackup() }
}

function getInfo() {
  const lastBackup = getLastBackup()
  return {
    dbPath: getDbPath(),
    dataDir: getDataDir(),
    backupDir: getBackupDir(),
    hasState: Boolean(getAppState()),
    hasBackupToday: hasBackupForToday(),
    lastBackup: lastBackup ? { name: lastBackup.name, path: lastBackup.path, mtimeMs: lastBackup.mtimeMs } : null
  }
}

module.exports = {
  getAppState,
  setAppState,
  backupDatabase,
  ensureDailyBackup,
  getInfo
}
