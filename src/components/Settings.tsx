import { useEffect, useState } from 'react'
import { AppState } from '../lib/types'
import { demoState, downloadBackup, id, number, now, STORAGE_KEY } from '../lib/store'
import { Button, Card, Input, Select, Textarea } from './ui'
import DatabaseStatus from './DatabaseStatus'
import ActivityLog from './ActivityLog'
import { hashPin } from '../lib/security'
import { refreshCloudSession, pushStateToCloud } from '../lib/cloudSync'

export default function AppSettings({ s, patch, t, onLockOwner }: { s: AppState, patch: any, t: any, onLockOwner?: () => void }) {
  const [settings, setSettings] = useState(s.settings); const [expense, setExpense] = useState({ title: '', amount: 0, note: '' }); const [dbInfo, setDbInfo] = useState<any>(null); const [cloudTest, setCloudTest] = useState(''); const [cloudPassword, setCloudPassword] = useState(''); const [syncing, setSyncing] = useState(false); const [pinDraft, setPinDraft] = useState('')
  const refreshDbInfo = () => window.desktopApp?.getDatabaseInfo?.().then(setDbInfo).catch(() => setDbInfo(null))
  useEffect(() => { refreshDbInfo() }, [])
  const backup = () => {
    patch((old: AppState) => downloadBackup(old))
    window.desktopApp?.backupDatabase?.().then(path => console.log('SQLite backup saved:', path)).catch(err => console.error('SQLite backup failed', err))
  }
  const restore = (file?: File) => { if (!file) return; const r = new FileReader(); r.onload = async () => { try { const restored = JSON.parse(String(r.result)); localStorage.setItem(STORAGE_KEY, JSON.stringify(restored)); await window.desktopApp?.setAppState?.(restored); location.reload() } catch { alert('Invalid backup file') } }; r.readAsText(file) }
  const addExpense = () => { if (!expense.title || !expense.amount) return; patch((old: AppState) => ({ ...old, expenses: [{ id: id(), date: now(), ...expense }, ...old.expenses] })); setExpense({ title: '', amount: 0, note: '' }) }
  const cloudHeaders = (token?: string) => ({ apikey: settings.supabaseAnonKey, Authorization: `Bearer ${token || settings.cloudAccessToken || settings.supabaseAnonKey}`, 'Content-Type': 'application/json' })
  const saveCloudSettings = (nextSettings = settings) => patch((old: AppState) => ({ ...old, settings: nextSettings }))
  const recordSyncStatus = (status: string, message: string, extra: Partial<typeof settings> = {}) => {
    const next = { ...settings, ...extra, lastCloudSyncStatus: status, lastCloudSyncMessage: message }
    setSettings(next)
    saveCloudSettings(next)
  }
  const testCloudConnection = async () => {
    setCloudTest('Testing...')
    try {
      if (!settings.supabaseUrl || !settings.supabaseAnonKey) { setCloudTest('Enter Supabase URL and anon key first'); return }
      const url = `${settings.supabaseUrl.replace(/\/$/, '')}/rest/v1/shops?select=id&limit=1`
      const res = await fetch(url, { headers: cloudHeaders() })
      setCloudTest(res.ok ? 'Connection OK. Schema/API reachable.' : `Connection failed: ${res.status} ${res.statusText}`)
    } catch (error) {
      setCloudTest(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  const signUpCloud = async () => {
    setCloudTest('Creating cloud account...')
    try {
      if (!settings.supabaseUrl || !settings.supabaseAnonKey || !settings.cloudEmail || !cloudPassword) { setCloudTest('Enter Supabase URL, anon key, email and password'); return }
      const res = await fetch(`${settings.supabaseUrl.replace(/\/$/, '')}/auth/v1/signup`, { method: 'POST', headers: { apikey: settings.supabaseAnonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: settings.cloudEmail, password: cloudPassword }) })
      const data = await res.json()
      if (!res.ok) { setCloudTest(data?.msg || data?.message || `Sign up failed: ${res.status}`); return }
      if (data.access_token) {
        const next = { ...settings, cloudUserId: data.user?.id || '', cloudAccessToken: data.access_token, cloudRefreshToken: data.refresh_token || '' }
        setSettings(next); saveCloudSettings(next); setCloudTest('Account created and signed in.')
      } else {
        setCloudTest('Account created. Check email confirmation if Supabase requires it, then sign in.')
      }
    } catch (error) { setCloudTest(`Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`) }
  }
  const signInCloud = async () => {
    setCloudTest('Signing in...')
    try {
      if (!settings.supabaseUrl || !settings.supabaseAnonKey || !settings.cloudEmail || !cloudPassword) { setCloudTest('Enter Supabase URL, anon key, email and password'); return }
      const res = await fetch(`${settings.supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: settings.supabaseAnonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: settings.cloudEmail, password: cloudPassword }) })
      const data = await res.json()
      if (!res.ok) { setCloudTest(data?.error_description || data?.msg || data?.message || `Sign in failed: ${res.status}`); return }
      const next = { ...settings, cloudUserId: data.user?.id || '', cloudAccessToken: data.access_token || '', cloudRefreshToken: data.refresh_token || '' }
      setSettings(next); saveCloudSettings(next); setCloudTest('Signed in to Supabase.')
    } catch (error) { setCloudTest(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`) }
  }

  const refreshCloudLogin = async () => {
    setCloudTest('Refreshing Supabase session...')
    try {
      const next = await refreshCloudSession(settings)
      setSettings(next)
      saveCloudSettings(next)
      setCloudTest('Supabase session refreshed.')
      return next
    } catch (error) {
      const message = `Session refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      setCloudTest(message)
      recordSyncStatus('session_refresh_failed', message)
      return null
    }
  }

  const resetCloudLogin = () => {
    if (!confirm('Clear saved cloud login tokens? You can sign in again later.')) return
    const next = { ...settings, cloudUserId: '', cloudAccessToken: '', cloudRefreshToken: '', lastCloudSyncStatus: 'cloud_login_reset', lastCloudSyncMessage: 'Cloud login tokens cleared.' }
    setSettings(next)
    saveCloudSettings(next)
    setCloudTest('Cloud login cleared. Sign in again to sync.')
  }
  const clearCloudShop = () => {
    if (!confirm('Clear connected Cloud Shop ID? Local data will remain on this computer.')) return
    const next = { ...settings, cloudShopId: '', cloudSyncEnabled: false, autoCloudPushEnabled: false, lastCloudSyncStatus: 'cloud_shop_cleared', lastCloudSyncMessage: 'Cloud shop connection cleared.' }
    setSettings(next)
    saveCloudSettings(next)
    setCloudTest('Cloud shop cleared. Create/connect a shop again to sync.')
  }
  const disableCloudSync = () => {
    const next = { ...settings, cloudSyncEnabled: false, autoCloudPushEnabled: false, lastCloudSyncStatus: 'cloud_sync_disabled', lastCloudSyncMessage: 'Cloud sync disabled.' }
    setSettings(next)
    saveCloudSettings(next)
    setCloudTest('Cloud sync disabled. Local desktop app will continue working offline.')
  }
  const createCloudShop = async () => {
    setCloudTest('Creating cloud shop...')
    try {
      if (!settings.cloudAccessToken || !settings.cloudUserId) { setCloudTest('Sign in first.'); return }
      const base = settings.supabaseUrl.replace(/\/$/, '')
      const res = await fetch(`${base}/rest/v1/rpc/create_shop_with_owner`, {
        method: 'POST',
        headers: cloudHeaders(settings.cloudAccessToken),
        body: JSON.stringify({
          p_name: settings.name,
          p_owner: settings.owner,
          p_address: settings.address,
          p_phone: settings.phone,
          p_upi_id: settings.upiId,
          p_receipt_size: settings.receiptSize,
          p_receipt_footer: settings.receiptFooter,
          p_device_id: 'desktop'
        })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setCloudTest(data?.message || data?.hint || `Create shop failed: ${res.status}`); return }
      const shopId = typeof data === 'string' ? data : data
      if (!shopId) { setCloudTest('Shop creation returned no ID. Run updated schema.sql in Supabase.'); return }
      const next = { ...settings, cloudShopId: shopId, cloudSyncEnabled: true }
      setSettings(next); saveCloudSettings(next); setCloudTest(`Cloud shop connected: ${shopId}`)
    } catch (error) { setCloudTest(`Create shop failed: ${error instanceof Error ? error.message : 'Unknown error'}`) }
  }

  const upsertCloud = async (table: string, rows: any[], conflict = 'shop_id,local_id') => {
    if (!rows.length) return []
    const base = settings.supabaseUrl.replace(/\/$/, '')
    const res = await fetch(`${base}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflict)}`, {
      method: 'POST',
      headers: { ...cloudHeaders(settings.cloudAccessToken), Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(rows)
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.message || data?.hint || `${table} upsert failed: ${res.status}`)
    return Array.isArray(data) ? data : []
  }
  const pushLocalToCloud = async () => {
    setSyncing(true)
    setCloudTest('Refreshing session and pushing local data to cloud...')
    try {
      const freshSettings = await refreshCloudSession(settings)
      setSettings(freshSettings)
      saveCloudSettings(freshSettings)
      const message = await pushStateToCloud(s, freshSettings)
      setCloudTest(message)
      recordSyncStatus('push_success', message, { ...freshSettings, lastCloudPushAt: new Date().toISOString() })
      return true
    } catch (error) {
      const message = `Push failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      setCloudTest(message)
      recordSyncStatus('push_failed', message)
      return false
    } finally {
      setSyncing(false)
    }
  }
  const fetchCloudTable = async (table: string) => {
    const base = settings.supabaseUrl.replace(/\/$/, '')
    const res = await fetch(`${base}/rest/v1/${table}?shop_id=eq.${settings.cloudShopId}&deleted_at=is.null&select=*`, { headers: cloudHeaders(settings.cloudAccessToken) })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.message || `${table} fetch failed: ${res.status}`)
    return Array.isArray(data) ? data : []
  }
  const pullCloudToLocal = async (skipConfirm = false) => {
    if (!skipConfirm && !confirm('Pull cloud data to this desktop? This will replace local app data with cloud data. A SQLite backup will be created first. Continue?')) return false
    setSyncing(true)
    setCloudTest('Creating safety backup before pull...')
    try {
      const backupPath = await window.desktopApp?.backupDatabase?.()
      if (backupPath) console.log('Pre-pull SQLite backup:', backupPath)
    } catch (error) {
      const message = `Pull stopped: backup failed (${error instanceof Error ? error.message : 'Unknown error'})`
      setCloudTest(message)
      recordSyncStatus('pull_blocked_backup_failed', message)
      setSyncing(false)
      return false
    }
    setCloudTest('Pulling cloud data to local...')
    try {
      if (!settings.supabaseUrl || !settings.supabaseAnonKey) throw new Error('Enter Supabase URL and anon key')
      if (!settings.cloudAccessToken) throw new Error('Sign in first')
      if (!settings.cloudShopId) throw new Error('Create/connect cloud shop first')
      const base = settings.supabaseUrl.replace(/\/$/, '')
      const shopRes = await fetch(`${base}/rest/v1/shops?id=eq.${settings.cloudShopId}&select=*`, { headers: cloudHeaders(settings.cloudAccessToken) })
      const shopRows = await shopRes.json().catch(() => [])
      if (!shopRes.ok) throw new Error(shopRows?.message || `Shop fetch failed: ${shopRes.status}`)
      const shop = Array.isArray(shopRows) ? shopRows[0] : null

      const [vegetableRows, customerRows, supplierRows, saleRows, saleItemRows, purchaseRows, purchaseItemRows, paymentRows, expenseRows, returnRows, stockLogRows] = await Promise.all([
        fetchCloudTable('vegetables'), fetchCloudTable('customers'), fetchCloudTable('suppliers'), fetchCloudTable('sales'), fetchCloudTable('sale_items'), fetchCloudTable('purchases'), fetchCloudTable('purchase_items'), fetchCloudTable('payments'), fetchCloudTable('expenses'), fetchCloudTable('returns'), fetchCloudTable('stock_logs')
      ])

      const saleItemsBySale = new Map<string, any[]>()
      saleItemRows.forEach(item => { const key = item.sale_local_id || item.sale_id; saleItemsBySale.set(key, [...(saleItemsBySale.get(key) || []), item]) })
      const purchaseItemsByPurchase = new Map<string, any[]>()
      purchaseItemRows.forEach(item => { const key = item.purchase_local_id || item.purchase_id; purchaseItemsByPurchase.set(key, [...(purchaseItemsByPurchase.get(key) || []), item]) })

      const pulledState: AppState = {
        ...s,
        settings: {
          ...s.settings,
          name: shop?.name || s.settings.name,
          owner: shop?.owner || s.settings.owner,
          address: shop?.address || s.settings.address,
          phone: shop?.phone || s.settings.phone,
          upiId: shop?.upi_id || s.settings.upiId,
          receiptSize: shop?.receipt_size || s.settings.receiptSize,
          receiptFooter: shop?.receipt_footer || s.settings.receiptFooter,
          supabaseUrl: settings.supabaseUrl,
          supabaseAnonKey: settings.supabaseAnonKey,
          cloudShopId: settings.cloudShopId,
          cloudEmail: settings.cloudEmail,
          cloudUserId: settings.cloudUserId,
          cloudAccessToken: settings.cloudAccessToken,
          cloudRefreshToken: settings.cloudRefreshToken,
          cloudSyncEnabled: settings.cloudSyncEnabled
        },
        vegetables: vegetableRows.map(v => ({ id: v.local_id || v.id, name: v.name || '', hindiName: v.hindi_name || '', category: v.category || '', unit: v.unit || 'kg', barcode: v.barcode || '', purchaseRate: Number(v.purchase_rate || 0), sellingRate: Number(v.selling_rate || 0), stock: Number(v.stock || 0), lowStock: Number(v.low_stock || 0), wastagePercent: Number(v.wastage_percent || 0), active: v.active !== false, lastUpdated: v.updated_at || now() })),
        customers: customerRows.map(c => ({ id: c.local_id || c.id, name: c.name || '', phone: c.phone || '', address: c.address || '', balance: Number(c.balance || 0) })),
        suppliers: supplierRows.map(sup => ({ id: sup.local_id || sup.id, name: sup.name || '', phone: sup.phone || '', address: sup.address || '' })),
        sales: saleRows.map(sale => ({ id: sale.local_id || sale.id, billNo: sale.bill_no || '', date: sale.date || now(), customerId: sale.customer_local_id || '', customerName: sale.customer_name || '', customerPhone: sale.customer_phone || '', subtotal: Number(sale.subtotal || 0), discount: Number(sale.discount || 0), roundOff: Number(sale.round_off || 0), total: Number(sale.total || 0), paid: Number(sale.paid || 0), due: Number(sale.due || 0), paymentMode: sale.payment_mode || 'Cash', cancelledAt: sale.cancelled_at || undefined, cancelReason: sale.cancel_reason || undefined, items: (saleItemsBySale.get(sale.local_id || sale.id) || []).map(item => ({ vegetableId: item.vegetable_local_id || '', name: item.name || '', hindiName: item.hindi_name || '', unit: item.unit || 'kg', qty: Number(item.qty || 0), rate: Number(item.rate || 0), discount: Number(item.discount || 0) })) })),
        purchases: purchaseRows.map(purchase => ({ id: purchase.local_id || purchase.id, date: purchase.date || now(), supplierId: purchase.supplier_local_id || '', supplierName: purchase.supplier_name || '', total: Number(purchase.total || 0), paid: Number(purchase.paid || 0), due: Number(purchase.due || 0), items: (purchaseItemsByPurchase.get(purchase.local_id || purchase.id) || []).map(item => ({ vegetableId: item.vegetable_local_id || '', name: item.name || '', qty: Number(item.qty || 0), rate: Number(item.rate || 0) })) })),
        payments: paymentRows.map(payment => ({ id: payment.local_id || payment.id, date: payment.date || now(), partyType: payment.party_type || 'customer', partyId: payment.party_local_id || '', partyName: payment.party_name || '', amount: Number(payment.amount || 0), mode: payment.mode || 'Cash', note: payment.note || '' })),
        expenses: expenseRows.map(expense => ({ id: expense.local_id || expense.id, date: expense.date || now(), title: expense.title || '', amount: Number(expense.amount || 0), note: expense.note || '' })),
        returns: returnRows.map(ret => ({ id: ret.local_id || ret.id, date: ret.date || now(), saleId: ret.sale_local_id || '', billNo: ret.bill_no || '', vegetableId: ret.vegetable_local_id || '', vegetableName: ret.vegetable_name || '', qty: Number(ret.qty || 0), unit: ret.unit || 'kg', rate: Number(ret.rate || 0), amount: Number(ret.amount || 0), reason: ret.reason || '' })),
        stockLogs: stockLogRows.map(log => ({ id: log.local_id || log.id, date: log.date || now(), vegetableId: log.vegetable_local_id || '', vegetableName: log.vegetable_name || '', type: log.type || 'ADJUSTMENT', qty: Number(log.qty || 0), beforeStock: Number(log.before_stock || 0), afterStock: Number(log.after_stock || 0), note: log.note || '' })),
        billCounter: Math.max(1, ...saleRows.map(row => Number(String(row.bill_no || '').replace(/\D/g, '')) || 0)) + 1
      }
      patch(() => pulledState)
      setSettings(pulledState.settings)
      const message = `Pull complete. Downloaded: ${pulledState.vegetables.length} vegetables, ${pulledState.sales.length} sales, ${pulledState.purchases.length} purchases.`
      setCloudTest(message)
      recordSyncStatus('pull_success', message, { lastCloudPullAt: new Date().toISOString() })
      return true
    } catch (error) {
      const message = `Pull failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      setCloudTest(message)
      recordSyncStatus('pull_failed', message)
      return false
    } finally {
      setSyncing(false)
    }
  }

  const runCloudHealthCheck = async () => {
    setCloudTest('Running cloud sync health check...')
    const results: string[] = []
    try {
      if (!settings.supabaseUrl) throw new Error('Missing Supabase URL')
      if (!settings.supabaseAnonKey) throw new Error('Missing anon key')
      const base = settings.supabaseUrl.replace(/\/$/, '')
      results.push('URL: OK')

      const settingsRes = await fetch(`${base}/auth/v1/settings`, { headers: { apikey: settings.supabaseAnonKey } })
      results.push(settingsRes.ok ? 'Anon key: OK' : `Anon key/settings: ${settingsRes.status}`)

      let freshSettings = settings
      if (settings.cloudRefreshToken) {
        try {
          freshSettings = await refreshCloudSession(settings)
          setSettings(freshSettings)
          saveCloudSettings(freshSettings)
          results.push('Session refresh: OK')
        } catch (error) {
          results.push(`Session refresh: FAILED (${error instanceof Error ? error.message : 'unknown'})`)
        }
      } else {
        results.push('Session refresh: skipped')
      }

      if (freshSettings.cloudAccessToken) {
        const userRes = await fetch(`${base}/auth/v1/user`, { headers: { apikey: freshSettings.supabaseAnonKey, Authorization: `Bearer ${freshSettings.cloudAccessToken}` } })
        results.push(userRes.ok ? 'Signed in user: OK' : `Signed in user: ${userRes.status}`)
      } else {
        results.push('Signed in user: missing token')
      }

      const requiredTables = ['shops', 'shop_users', 'vegetables', 'customers', 'suppliers', 'sales', 'sale_items', 'purchases', 'purchase_items', 'payments', 'expenses', 'returns', 'stock_logs', 'sync_devices']
      for (const table of requiredTables) {
        const res = await fetch(`${base}/rest/v1/${table}?select=id&limit=1`, { headers: cloudHeaders(freshSettings.cloudAccessToken || freshSettings.supabaseAnonKey) })
        results.push(res.ok || res.status === 406 ? `${table}: OK` : `${table}: ${res.status}`)
      }

      if (freshSettings.cloudShopId && freshSettings.cloudAccessToken) {
        const shopRes = await fetch(`${base}/rest/v1/shops?id=eq.${freshSettings.cloudShopId}&select=id,name`, { headers: cloudHeaders(freshSettings.cloudAccessToken) })
        const shopData = await shopRes.json().catch(() => [])
        results.push(shopRes.ok && Array.isArray(shopData) && shopData.length ? 'Cloud shop access: OK' : `Cloud shop access: ${shopRes.status}`)
      } else {
        results.push('Cloud shop access: skipped')
      }

      const message = `Health check complete: ${results.join(' | ')}`
      setCloudTest(message)
      recordSyncStatus('health_check_complete', message)
    } catch (error) {
      const message = `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}${results.length ? ' | ' + results.join(' | ') : ''}`
      setCloudTest(message)
      recordSyncStatus('health_check_failed', message)
    }
  }

  const checkCloudCounts = async () => {
    setCloudTest('Refreshing session and checking cloud row counts...')
    try {
      if (!settings.cloudShopId) throw new Error('Connect cloud shop first')
      const freshSettings = await refreshCloudSession(settings)
      setSettings(freshSettings)
      saveCloudSettings(freshSettings)
      const tables = ['vegetables', 'customers', 'suppliers', 'sales', 'sale_items', 'purchases', 'purchase_items', 'payments', 'expenses', 'returns', 'stock_logs']
      const base = freshSettings.supabaseUrl.replace(/\/$/, '')
      const counts: Record<string, string> = {}
      for (const table of tables) {
        const res = await fetch(`${base}/rest/v1/${table}?shop_id=eq.${settings.cloudShopId}&select=id`, { method: 'HEAD', headers: { ...cloudHeaders(freshSettings.cloudAccessToken), Prefer: 'count=exact' } })
        const range = res.headers.get('content-range') || ''
        counts[table] = range.includes('/') ? range.split('/').pop() || '0' : (res.ok ? '0' : `ERR ${res.status}`)
      }
      const message = `Cloud counts: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(', ')}`
      setCloudTest(message)
      recordSyncStatus('count_check_success', message)
    } catch (error) {
      const message = `Cloud count check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      setCloudTest(message)
      recordSyncStatus('count_check_failed', message)
    }
  }
  const syncNow = async () => {
    if (!confirm('Sync Now will create a SQLite backup, push local data to cloud, then pull cloud data back to this desktop. Continue?')) return
    setSyncing(true)
    setCloudTest('Starting sync: creating safety backup...')
    try {
      const backupPath = await window.desktopApp?.backupDatabase?.()
      if (backupPath) console.log('Pre-sync SQLite backup:', backupPath)
    } catch (error) {
      setSyncing(false)
      const message = `Sync stopped: pre-sync backup failed (${error instanceof Error ? error.message : 'Unknown error'})`
      setCloudTest(message)
      recordSyncStatus('sync_failed', message)
      return
    }
    setSyncing(false)
    const pushed = await pushLocalToCloud()
    if (!pushed) return
    const pulled = await pullCloudToLocal(true)
    if (!pulled) return
    const syncedAt = new Date().toISOString()
    const message = `Sync complete at ${new Date(syncedAt).toLocaleString()}`
    setCloudTest(message)
    recordSyncStatus('sync_success', message, { lastCloudSyncAt: syncedAt, cloudSyncEnabled: true })
  }
  return <div className="space settings-page"><DatabaseStatus settings={s.settings} /><ActivityLog s={s} /><Card className="pad"><h2>{t.settings}</h2><div className="form-grid"><Input value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} placeholder="Shop Name"/><Input value={settings.owner} onChange={e => setSettings({ ...settings, owner: e.target.value })} placeholder="Owner"/><Input value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} placeholder={t.phone}/><Select value={settings.receiptSize} onChange={e => setSettings({ ...settings, receiptSize: e.target.value as any })}><option value="80mm">80mm</option><option value="58mm">58mm</option></Select><Input value={settings.upiId} onChange={e => setSettings({ ...settings, upiId: e.target.value })} placeholder="UPI ID e.g. shop@upi"/><label className="check-row"><input type="checkbox" checked={settings.showUpiOnReceipt} onChange={e => setSettings({ ...settings, showUpiOnReceipt: e.target.checked })}/> Show UPI placeholder on receipt</label><Input value={settings.receiptFooter} onChange={e => setSettings({ ...settings, receiptFooter: e.target.value })} placeholder="Receipt footer message"/><Textarea value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} placeholder={t.address}/><Button onClick={() => patch((old: AppState) => ({ ...old, settings }))}>{t.save}</Button></div></Card><Card className="pad"><h2>Owner Security</h2><p className="muted">Protect Reports and Settings with an owner PIN. Billing remains open for staff use.</p><div className="form-grid"><label className="check-row"><input type="checkbox" checked={settings.ownerPinEnabled} onChange={e => setSettings({ ...settings, ownerPinEnabled: e.target.checked })}/> Enable owner PIN lock</label><Input type="password" inputMode="numeric" value={pinDraft} onChange={e => setPinDraft(e.target.value)} placeholder={settings.ownerPinHash || settings.ownerPin ? 'New PIN (leave blank to keep)' : 'Set owner PIN'} /><Button onClick={async () => { const newHash = pinDraft ? await hashPin(pinDraft) : settings.ownerPinHash || (settings.ownerPin ? await hashPin(settings.ownerPin) : ''); const next = { ...settings, ownerPin: '', ownerPinHash: newHash, ownerPinEnabled: settings.ownerPinEnabled && Boolean(newHash) }; setSettings(next); patch((old: AppState) => ({ ...old, settings: next })); setPinDraft('') }}>Save Security</Button>{settings.ownerPinEnabled && <Button variant="secondary" onClick={onLockOwner}>Lock Now</Button>}</div><div className="security-facts"><span className="status-pill good">PIN is stored as hash</span><span className="status-pill neutral">Billing stays unlocked</span><span className="status-pill warn">Reset/Restore protected</span></div><p className="muted">Protected: Reports, Settings, cloud sync controls, backup restore/reset, profit reports.</p></Card><Card className="pad"><h2>Cloud Sync Setup Guide</h2><p className="muted">Follow this order for safe setup. Cloud sync is manual-first; auto-push can be enabled after testing.</p><div className="guide-steps"><div><span>1</span><b>Run Supabase schema</b><small>Paste supabase/schema.sql in Supabase SQL Editor and run it.</small></div><div><span>2</span><b>Add URL + anon key</b><small>Use project API URL and anon public key, never service_role.</small></div><div><span>3</span><b>Sign up / Sign in</b><small>Create or login to owner account.</small></div><div><span>4</span><b>Create cloud shop</b><small>Click Create/Connect Cloud Shop to get Cloud Shop ID.</small></div><div><span>5</span><b>Push local data</b><small>Upload desktop data to Supabase.</small></div><div><span>6</span><b>Check cloud counts</b><small>Confirm rows are present in Supabase.</small></div><div><span>7</span><b>Sync Now</b><small>Backup, push, then pull back safely.</small></div><div><span>8</span><b>Enable auto push</b><small>Only after manual sync is tested successfully.</small></div></div></Card><Card className="pad"><h2>Cloud Sync Settings</h2><p className="muted">Supabase configuration and manual sync controls. Safe mode is enabled: auto-pull is disabled and pull creates a backup first.</p><div className="form-grid"><Input value={settings.supabaseUrl} onChange={e => setSettings({ ...settings, supabaseUrl: e.target.value })} placeholder="Supabase URL"/><Input value={settings.supabaseAnonKey} onChange={e => setSettings({ ...settings, supabaseAnonKey: e.target.value })} placeholder="Supabase anon key"/><Input value={settings.cloudEmail} onChange={e => setSettings({ ...settings, cloudEmail: e.target.value })} placeholder="Owner email"/><Input type="password" value={cloudPassword} onChange={e => setCloudPassword(e.target.value)} placeholder="Password (not saved)"/><Input value={settings.cloudShopId} onChange={e => setSettings({ ...settings, cloudShopId: e.target.value })} placeholder="Cloud Shop ID"/><label className="check-row"><input type="checkbox" checked={settings.cloudSyncEnabled} onChange={e => setSettings({ ...settings, cloudSyncEnabled: e.target.checked })}/> Enable cloud sync when ready</label><label className="check-row"><input type="checkbox" checked={settings.autoCloudPushEnabled} onChange={e => setSettings({ ...settings, autoCloudPushEnabled: e.target.checked })}/> Auto push local data</label><Input type="number" value={settings.autoCloudPushMinutes} onChange={e => setSettings({ ...settings, autoCloudPushMinutes: number(e.target.value) || 10 })} placeholder="Auto push every X minutes"/><Button onClick={() => saveCloudSettings()}>Save Cloud Settings</Button><Button variant="secondary" onClick={testCloudConnection}>Test Connection</Button><Button variant="secondary" onClick={runCloudHealthCheck}>Cloud Health Check</Button><Button variant="secondary" onClick={signUpCloud}>Sign Up</Button><Button variant="secondary" onClick={signInCloud}>Sign In</Button><Button variant="secondary" onClick={refreshCloudLogin}>Refresh Session</Button><Button variant="secondary" onClick={createCloudShop}>Create/Connect Cloud Shop</Button><Button variant="secondary" disabled={syncing} onClick={pushLocalToCloud}>{syncing ? 'Working...' : 'Push Local Data to Cloud'}</Button><Button variant="secondary" disabled={syncing} onClick={() => pullCloudToLocal()}>{syncing ? 'Working...' : 'Pull Cloud Data to Local'}</Button><Button variant="secondary" disabled={syncing} onClick={checkCloudCounts}>Check Cloud Counts</Button><Button disabled={syncing} onClick={syncNow}>{syncing ? 'Syncing...' : 'Sync Now'}</Button></div><div className="cloud-facts"><div><span>User</span><b>{settings.cloudUserId ? 'Signed in' : 'Not signed in'}</b></div><div><span>Shop</span><b>{settings.cloudShopId || 'Not connected'}</b></div><div><span>Sync</span><b>{settings.cloudSyncEnabled ? 'Enabled for future sync' : 'Disabled'}</b></div></div><div className="sync-safety"><h3 className="mini-title">Sync Safety</h3><div className="status-strip"><span className="status-pill good">Auto Push Only</span><span className="status-pill warn">Auto Pull Disabled</span><span className="status-pill good">Backup Before Pull</span><span className="status-pill neutral">Manual Conflict Review</span></div><p className="muted">Use Pull only when you are sure cloud data should replace this desktop. A SQLite backup is created before every pull.</p></div><div className="setup-checklist"><h3 className="mini-title">Cloud Setup Checklist</h3><div className="checklist-grid"><div className={settings.supabaseUrl ? 'done' : ''}><span>{settings.supabaseUrl ? '✓' : '1'}</span><b>Supabase URL</b><small>{settings.supabaseUrl ? 'Added' : 'Required'}</small></div><div className={settings.supabaseAnonKey ? 'done' : ''}><span>{settings.supabaseAnonKey ? '✓' : '2'}</span><b>Anon Key</b><small>{settings.supabaseAnonKey ? 'Added' : 'Required'}</small></div><div className={settings.cloudUserId ? 'done' : ''}><span>{settings.cloudUserId ? '✓' : '3'}</span><b>Signed In</b><small>{settings.cloudUserId ? settings.cloudEmail || 'Signed in' : 'Sign in needed'}</small></div><div className={settings.cloudShopId ? 'done' : ''}><span>{settings.cloudShopId ? '✓' : '4'}</span><b>Cloud Shop</b><small>{settings.cloudShopId ? 'Connected' : 'Create/connect'}</small></div><div className={settings.lastCloudPushAt ? 'done' : ''}><span>{settings.lastCloudPushAt ? '✓' : '5'}</span><b>Push Tested</b><small>{settings.lastCloudPushAt ? new Date(settings.lastCloudPushAt).toLocaleString() : 'Not yet'}</small></div><div className={settings.lastCloudPullAt ? 'done' : ''}><span>{settings.lastCloudPullAt ? '✓' : '6'}</span><b>Pull Tested</b><small>{settings.lastCloudPullAt ? new Date(settings.lastCloudPullAt).toLocaleString() : 'Not yet'}</small></div><div className={settings.lastCloudSyncAt ? 'done' : ''}><span>{settings.lastCloudSyncAt ? '✓' : '7'}</span><b>Sync Now Tested</b><small>{settings.lastCloudSyncAt ? new Date(settings.lastCloudSyncAt).toLocaleString() : 'Not yet'}</small></div><div className={settings.autoCloudPushEnabled ? 'done' : ''}><span>{settings.autoCloudPushEnabled ? '✓' : '8'}</span><b>Auto Push</b><small>{settings.autoCloudPushEnabled ? `Every ${settings.autoCloudPushMinutes || 10} min` : 'Optional'}</small></div></div></div><div className="sync-history"><h3 className="mini-title">Sync History</h3><div className="list-row"><span>Last Push</span><b>{settings.lastCloudPushAt ? new Date(settings.lastCloudPushAt).toLocaleString() : 'Never'}</b></div><div className="list-row"><span>Last Auto Push</span><b>{settings.lastAutoCloudPushAt ? new Date(settings.lastAutoCloudPushAt).toLocaleString() : 'Never'}</b></div><div className="list-row"><span>Last Pull</span><b>{settings.lastCloudPullAt ? new Date(settings.lastCloudPullAt).toLocaleString() : 'Never'}</b></div><div className="list-row"><span>Last Full Sync</span><b>{settings.lastCloudSyncAt ? new Date(settings.lastCloudSyncAt).toLocaleString() : 'Never'}</b></div><div className="list-row"><span>Status</span><b>{settings.lastCloudSyncStatus || 'None'}</b></div>{settings.lastCloudSyncMessage && <div className="sync-message">{settings.lastCloudSyncMessage}</div>}</div><div className="cloud-troubleshoot"><h3 className="mini-title">Troubleshooting</h3><p className="muted">Use these only if sync setup is wrong, token expired, or you connected the wrong shop.</p><div className="toolbar"><Button variant="secondary" onClick={resetCloudLogin}>Reset Cloud Login</Button><Button variant="secondary" onClick={clearCloudShop}>Clear Cloud Shop ID</Button><Button variant="danger" onClick={disableCloudSync}>Disable Cloud Sync</Button></div></div>{cloudTest && <p className="muted">{cloudTest}</p>}</Card><Card className="pad"><h2>{t.expense}</h2><div className="form-grid"><Input placeholder={t.expense} value={expense.title} onChange={e => setExpense({ ...expense, title: e.target.value })}/><Input type="number" placeholder={t.amount} value={expense.amount} onChange={e => setExpense({ ...expense, amount: number(e.target.value) })}/><Input placeholder={t.note} value={expense.note} onChange={e => setExpense({ ...expense, note: e.target.value })}/><Button onClick={addExpense}>{t.add}</Button></div></Card>{dbInfo && <Card className="pad"><h2>SQLite Database</h2><p className="muted">Desktop data is now stored in SQLite.</p><div className="list-row"><span>Database</span><b>{dbInfo.dbPath}</b></div><div className="list-row"><span>Backup Folder</span><b>{dbInfo.backupDir}</b></div><div className="list-row"><span>Folder Type</span><b>{dbInfo.hasCustomBackupDir ? 'Custom' : 'Default'}</b></div><div className="list-row"><span>Today's SQLite backup</span><b>{dbInfo.hasBackupToday ? 'Done' : 'Not yet'}</b></div><div className="list-row"><span>Last SQLite backup</span><b>{dbInfo.lastBackup ? dbInfo.lastBackup.name : 'Never'}</b></div><div className="list-row"><span>Normalized at</span><b>{dbInfo.normalizedAt ? new Date(dbInfo.normalizedAt).toLocaleString() : 'Not yet'}</b></div>{dbInfo.normalizedCounts && <div><h3 className="mini-title">Normalized Table Counts</h3><div className="count-grid">{Object.entries(dbInfo.normalizedCounts).map(([key, value]) => <div key={key}><span>{key}</span><b>{String(value)}</b></div>)}</div></div>}<div className="toolbar"><Button variant="secondary" onClick={() => window.desktopApp?.chooseBackupDir?.().then(path => { if (path) alert(`Backup folder selected:\n${path}`); refreshDbInfo() })}>Choose Backup Folder</Button><Button variant="secondary" onClick={() => window.desktopApp?.resetBackupDir?.().then(path => { alert(`Backup folder reset:\n${path}`); refreshDbInfo() })}>Use Default Folder</Button><Button variant="secondary" onClick={() => window.desktopApp?.backupDatabase?.().then(path => { alert(`SQLite backup saved:\n${path}`); refreshDbInfo() })}>Backup SQLite DB</Button><Button variant="secondary" onClick={() => window.desktopApp?.ensureDailyBackup?.().then(result => { alert(result.created ? `Daily backup created:\n${result.path}` : `Daily backup check: ${result.reason}`); refreshDbInfo() })}>Check Daily Backup</Button></div></Card>}<Card className="pad"><h2>{t.backup}</h2><p className="muted">Last backup: {s.lastBackupAt ? new Date(s.lastBackupAt).toLocaleString() : 'Never'}</p><div className="toolbar"><Button variant="secondary" onClick={backup}>{t.backup}</Button><label className="btn secondary">{t.restore}<input type="file" accept=".json" hidden onChange={e => restore(e.target.files?.[0])}/></label><Button variant="danger" onClick={async () => { if (confirm('Reset all data?')) { localStorage.setItem(STORAGE_KEY, JSON.stringify(demoState)); await window.desktopApp?.setAppState?.(demoState); location.reload() } }}>{t.reset}</Button></div></Card></div>
}
