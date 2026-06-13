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

function getDefaultBackupDir() {
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

function safeJson(value) {
  return JSON.stringify(value ?? null)
}

function getDb() {
  if (db) return db
  ensureDir(getDataDir())
  ensureDir(getDefaultBackupDir())
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

    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT,
      address TEXT,
      phone TEXT,
      upi_id TEXT,
      receipt_size TEXT DEFAULT '80mm',
      receipt_footer TEXT,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'local'
    );

    CREATE TABLE IF NOT EXISTS vegetables (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      name TEXT NOT NULL,
      hindi_name TEXT,
      category TEXT,
      unit TEXT NOT NULL,
      barcode TEXT,
      purchase_rate REAL DEFAULT 0,
      selling_rate REAL DEFAULT 0,
      stock REAL DEFAULT 0,
      low_stock REAL DEFAULT 0,
      wastage_percent REAL DEFAULT 0,
      active INTEGER DEFAULT 1,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'local'
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'local'
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'local'
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      bill_no TEXT NOT NULL,
      date TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      round_off REAL DEFAULT 0,
      total REAL DEFAULT 0,
      paid REAL DEFAULT 0,
      due REAL DEFAULT 0,
      payment_mode TEXT,
      cancelled_at TEXT,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'local'
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      sale_id TEXT NOT NULL,
      vegetable_id TEXT NOT NULL,
      name TEXT NOT NULL,
      hindi_name TEXT,
      unit TEXT,
      qty REAL DEFAULT 0,
      rate REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'local'
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      date TEXT NOT NULL,
      supplier_id TEXT,
      supplier_name TEXT,
      total REAL DEFAULT 0,
      paid REAL DEFAULT 0,
      due REAL DEFAULT 0,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'local'
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      purchase_id TEXT NOT NULL,
      vegetable_id TEXT NOT NULL,
      name TEXT NOT NULL,
      qty REAL DEFAULT 0,
      rate REAL DEFAULT 0,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'local'
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      date TEXT NOT NULL,
      party_type TEXT NOT NULL,
      party_id TEXT,
      party_name TEXT,
      amount REAL DEFAULT 0,
      mode TEXT,
      note TEXT,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'local'
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL DEFAULT 0,
      note TEXT,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'local'
    );

    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      date TEXT NOT NULL,
      sale_id TEXT,
      bill_no TEXT,
      vegetable_id TEXT,
      vegetable_name TEXT,
      qty REAL DEFAULT 0,
      unit TEXT,
      rate REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      reason TEXT,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'local'
    );

    CREATE TABLE IF NOT EXISTS stock_logs (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      date TEXT NOT NULL,
      vegetable_id TEXT NOT NULL,
      vegetable_name TEXT,
      type TEXT NOT NULL,
      qty REAL DEFAULT 0,
      before_stock REAL DEFAULT 0,
      after_stock REAL DEFAULT 0,
      note TEXT,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'local'
    );

    CREATE INDEX IF NOT EXISTS idx_vegetables_shop ON vegetables(shop_id);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
    CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
    CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(date);
    CREATE INDEX IF NOT EXISTS idx_stock_logs_date ON stock_logs(date);
  `)
  db.prepare('INSERT OR IGNORE INTO sync_meta (key, value) VALUES (?, ?)').run('schema_version', '2')
  db.prepare('INSERT OR IGNORE INTO sync_meta (key, value) VALUES (?, ?)').run('shop_id', 'local-shop')
  db.prepare('INSERT OR IGNORE INTO sync_meta (key, value) VALUES (?, ?)').run('device_id', app.getName().replace(/\s+/g, '-').toLowerCase())
  return db
}

function getMeta(key) {
  const row = getDb().prepare('SELECT value FROM sync_meta WHERE key = ?').get(key)
  return row?.value || ''
}

function setMeta(key, value) {
  getDb().prepare(`
    INSERT INTO sync_meta (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value)
}

function getBackupDir() {
  const custom = getMeta('backup_dir')
  const dir = custom || getDefaultBackupDir()
  ensureDir(dir)
  return dir
}

function setBackupDir(dir) {
  if (!dir) return getBackupDir()
  ensureDir(dir)
  setMeta('backup_dir', dir)
  return dir
}

function resetBackupDir() {
  setMeta('backup_dir', '')
  ensureDir(getDefaultBackupDir())
  return getDefaultBackupDir()
}

function listBackups() {
  const backupDir = getBackupDir()
  return fs.readdirSync(backupDir)
    .filter(name => name.endsWith('.db'))
    .map(name => ({
      name,
      path: path.join(backupDir, name),
      mtimeMs: fs.statSync(path.join(backupDir, name)).mtimeMs
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

function getAppState() {
  const row = getDb().prepare('SELECT value FROM app_state WHERE key = ?').get('main')
  if (!row) return null
  try {
    return JSON.parse(row.value)
  } catch {
    return null
  }
}

function clearNormalizedTables(database) {
  const tables = ['stock_logs', 'returns', 'payments', 'purchase_items', 'purchases', 'sale_items', 'sales', 'expenses', 'suppliers', 'customers', 'vegetables', 'shops']
  for (const table of tables) database.prepare(`DELETE FROM ${table}`).run()
}

function writeNormalizedState(state) {
  if (!state) return
  const database = getDb()
  const shopId = getMeta('shop_id') || 'local-shop'
  const deviceId = getMeta('device_id') || 'desktop'
  const ts = new Date().toISOString()

  const tx = database.transaction(() => {
    clearNormalizedTables(database)

    const settings = state.settings || {}
    database.prepare(`INSERT INTO shops (id, name, owner, address, phone, upi_id, receipt_size, receipt_footer, raw_json, created_at, updated_at, device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(shopId, settings.name || 'Shop', settings.owner || '', settings.address || '', settings.phone || '', settings.upiId || '', settings.receiptSize || '80mm', settings.receiptFooter || '', safeJson(settings), ts, ts, deviceId)

    const insertVegetable = database.prepare(`INSERT INTO vegetables (id, shop_id, name, hindi_name, category, unit, barcode, purchase_rate, selling_rate, stock, low_stock, wastage_percent, active, raw_json, created_at, updated_at, device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
    for (const v of state.vegetables || []) insertVegetable.run(v.id, shopId, v.name || '', v.hindiName || '', v.category || '', v.unit || 'kg', v.barcode || '', v.purchaseRate || 0, v.sellingRate || 0, v.stock || 0, v.lowStock || 0, v.wastagePercent || 0, v.active === false ? 0 : 1, safeJson(v), v.lastUpdated || ts, v.lastUpdated || ts, deviceId)

    const insertCustomer = database.prepare(`INSERT INTO customers (id, shop_id, name, phone, address, balance, raw_json, created_at, updated_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
    for (const c of state.customers || []) insertCustomer.run(c.id, shopId, c.name || '', c.phone || '', c.address || '', c.balance || 0, safeJson(c), ts, ts, deviceId)

    const insertSupplier = database.prepare(`INSERT INTO suppliers (id, shop_id, name, phone, address, raw_json, created_at, updated_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
    for (const sup of state.suppliers || []) insertSupplier.run(sup.id, shopId, sup.name || '', sup.phone || '', sup.address || '', safeJson(sup), ts, ts, deviceId)

    const insertSale = database.prepare(`INSERT INTO sales (id, shop_id, bill_no, date, customer_id, customer_name, customer_phone, subtotal, discount, round_off, total, paid, due, payment_mode, raw_json, created_at, updated_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
    const insertSaleItem = database.prepare(`INSERT INTO sale_items (id, shop_id, sale_id, vegetable_id, name, hindi_name, unit, qty, rate, discount, raw_json, created_at, updated_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
    for (const sale of state.sales || []) {
      insertSale.run(sale.id, shopId, sale.billNo || '', sale.date || ts, sale.customerId || '', sale.customerName || '', sale.customerPhone || '', sale.subtotal || 0, sale.discount || 0, sale.roundOff || 0, sale.total || 0, sale.paid || 0, sale.due || 0, sale.paymentMode || '', safeJson(sale), sale.date || ts, sale.date || ts, deviceId)
      ;(sale.items || []).forEach((item, index) => insertSaleItem.run(`${sale.id}-${index}-${item.vegetableId}`, shopId, sale.id, item.vegetableId || '', item.name || '', item.hindiName || '', item.unit || '', item.qty || 0, item.rate || 0, item.discount || 0, safeJson(item), sale.date || ts, sale.date || ts, deviceId))
    }

    const insertPurchase = database.prepare(`INSERT INTO purchases (id, shop_id, date, supplier_id, supplier_name, total, paid, due, raw_json, created_at, updated_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
    const insertPurchaseItem = database.prepare(`INSERT INTO purchase_items (id, shop_id, purchase_id, vegetable_id, name, qty, rate, raw_json, created_at, updated_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
    for (const purchase of state.purchases || []) {
      insertPurchase.run(purchase.id, shopId, purchase.date || ts, purchase.supplierId || '', purchase.supplierName || '', purchase.total || 0, purchase.paid || 0, purchase.due || 0, safeJson(purchase), purchase.date || ts, purchase.date || ts, deviceId)
      ;(purchase.items || []).forEach((item, index) => insertPurchaseItem.run(`${purchase.id}-${index}-${item.vegetableId}`, shopId, purchase.id, item.vegetableId || '', item.name || '', item.qty || 0, item.rate || 0, safeJson(item), purchase.date || ts, purchase.date || ts, deviceId))
    }

    const insertPayment = database.prepare(`INSERT INTO payments (id, shop_id, date, party_type, party_id, party_name, amount, mode, note, raw_json, created_at, updated_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
    for (const payment of state.payments || []) insertPayment.run(payment.id, shopId, payment.date || ts, payment.partyType || 'customer', payment.partyId || '', payment.partyName || '', payment.amount || 0, payment.mode || '', payment.note || '', safeJson(payment), payment.date || ts, payment.date || ts, deviceId)

    const insertExpense = database.prepare(`INSERT INTO expenses (id, shop_id, date, title, amount, note, raw_json, created_at, updated_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
    for (const expense of state.expenses || []) insertExpense.run(expense.id, shopId, expense.date || ts, expense.title || '', expense.amount || 0, expense.note || '', safeJson(expense), expense.date || ts, expense.date || ts, deviceId)

    const insertReturn = database.prepare(`INSERT INTO returns (id, shop_id, date, sale_id, bill_no, vegetable_id, vegetable_name, qty, unit, rate, amount, reason, raw_json, created_at, updated_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
    for (const ret of state.returns || []) insertReturn.run(ret.id, shopId, ret.date || ts, ret.saleId || '', ret.billNo || '', ret.vegetableId || '', ret.vegetableName || '', ret.qty || 0, ret.unit || '', ret.rate || 0, ret.amount || 0, ret.reason || '', safeJson(ret), ret.date || ts, ret.date || ts, deviceId)

    const insertStockLog = database.prepare(`INSERT INTO stock_logs (id, shop_id, date, vegetable_id, vegetable_name, type, qty, before_stock, after_stock, note, raw_json, created_at, updated_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
    for (const log of state.stockLogs || []) insertStockLog.run(log.id, shopId, log.date || ts, log.vegetableId || '', log.vegetableName || '', log.type || 'ADJUSTMENT', log.qty || 0, log.beforeStock || 0, log.afterStock || 0, log.note || '', safeJson(log), log.date || ts, log.date || ts, deviceId)
  })

  tx()
  setMeta('normalized_at', ts)
}

function setAppState(state) {
  const value = JSON.stringify(state)
  const updatedAt = new Date().toISOString()
  getDb().prepare(`
    INSERT INTO app_state (key, value, updated_at)
    VALUES ('main', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(value, updatedAt)
  writeNormalizedState(state)
  return { ok: true, updatedAt }
}

function backupDatabase(prefix = 'shop') {
  const source = getDbPath()
  const backupDir = getBackupDir()
  if (!fs.existsSync(source)) getDb()
  const target = path.join(backupDir, `${prefix}-${getTimestamp()}.db`)
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

function countTable(table) {
  try {
    return getDb().prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count
  } catch {
    return 0
  }
}

function getNormalizedCounts() {
  return {
    vegetables: countTable('vegetables'),
    customers: countTable('customers'),
    suppliers: countTable('suppliers'),
    sales: countTable('sales'),
    saleItems: countTable('sale_items'),
    purchases: countTable('purchases'),
    purchaseItems: countTable('purchase_items'),
    payments: countTable('payments'),
    expenses: countTable('expenses'),
    returns: countTable('returns'),
    stockLogs: countTable('stock_logs')
  }
}

function getInfo() {
  const lastBackup = getLastBackup()
  const customBackupDir = getMeta('backup_dir')
  return {
    dbPath: getDbPath(),
    dataDir: getDataDir(),
    backupDir: getBackupDir(),
    defaultBackupDir: getDefaultBackupDir(),
    customBackupDir,
    hasCustomBackupDir: Boolean(customBackupDir),
    hasState: Boolean(getAppState()),
    hasBackupToday: hasBackupForToday(),
    lastBackup: lastBackup ? { name: lastBackup.name, path: lastBackup.path, mtimeMs: lastBackup.mtimeMs } : null,
    schemaVersion: getMeta('schema_version'),
    normalizedAt: getMeta('normalized_at'),
    normalizedCounts: getNormalizedCounts()
  }
}

module.exports = {
  getAppState,
  setAppState,
  backupDatabase,
  ensureDailyBackup,
  getInfo,
  setBackupDir,
  resetBackupDir
}
