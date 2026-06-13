import { AppState } from './types'

export function cloudHeadersFor(settings: any, token?: string) {
  return { apikey: settings.supabaseAnonKey, Authorization: `Bearer ${token || settings.cloudAccessToken || settings.supabaseAnonKey}`, 'Content-Type': 'application/json' }
}

export async function refreshCloudSession(settings: any) {
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) throw new Error('Missing Supabase URL or anon key')
  if (!settings.cloudRefreshToken) throw new Error('Session expired. Please sign in again.')
  const base = settings.supabaseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: settings.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: settings.cloudRefreshToken })
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error_description || data?.msg || data?.message || `Refresh failed: ${res.status}`)
  return {
    ...settings,
    cloudUserId: data.user?.id || settings.cloudUserId,
    cloudAccessToken: data.access_token || settings.cloudAccessToken,
    cloudRefreshToken: data.refresh_token || settings.cloudRefreshToken
  }
}

export async function upsertCloudRows(settings: any, table: string, rows: any[], conflict = 'shop_id,local_id') {
  if (!rows.length) return []
  const base = settings.supabaseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflict)}`, {
    method: 'POST',
    headers: { ...cloudHeadersFor(settings, settings.cloudAccessToken), Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(rows)
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message || data?.hint || `${table} upsert failed: ${res.status}`)
  return Array.isArray(data) ? data : []
}

export async function pushStateToCloud(state: AppState, settings: any) {
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) throw new Error('Enter Supabase URL and anon key')
  if (!settings.cloudAccessToken) throw new Error('Sign in first')
  if (!settings.cloudShopId) throw new Error('Create/connect cloud shop first')
  const shopId = settings.cloudShopId
  const ts = new Date().toISOString()
  const byLocal = (rows: any[]) => new Map(rows.map(row => [row.local_id, row.id]))

  const vegetables = await upsertCloudRows(settings, 'vegetables', state.vegetables.map(v => ({ shop_id: shopId, local_id: v.id, name: v.name, hindi_name: v.hindiName, category: v.category, unit: v.unit, barcode: v.barcode, purchase_rate: v.purchaseRate, selling_rate: v.sellingRate, stock: v.stock, low_stock: v.lowStock, wastage_percent: v.wastagePercent, active: v.active, device_id: 'desktop' })))
  const vegMap = byLocal(vegetables)
  const customers = await upsertCloudRows(settings, 'customers', state.customers.map(c => ({ shop_id: shopId, local_id: c.id, name: c.name, phone: c.phone, address: c.address, balance: c.balance, device_id: 'desktop' })))
  const customerMap = byLocal(customers)
  const suppliers = await upsertCloudRows(settings, 'suppliers', state.suppliers.map(sup => ({ shop_id: shopId, local_id: sup.id, name: sup.name, phone: sup.phone, address: sup.address, device_id: 'desktop' })))
  const supplierMap = byLocal(suppliers)
  const sales = await upsertCloudRows(settings, 'sales', state.sales.map(sale => ({ shop_id: shopId, local_id: sale.id, bill_no: sale.billNo, date: sale.date, customer_id: customerMap.get(sale.customerId) || null, customer_local_id: sale.customerId || null, customer_name: sale.customerName, customer_phone: sale.customerPhone, subtotal: sale.subtotal, discount: sale.discount, round_off: sale.roundOff, total: sale.total, paid: sale.paid, due: sale.due, payment_mode: sale.paymentMode, cancelled_at: sale.cancelledAt || null, device_id: 'desktop' })))
  const saleMap = byLocal(sales)
  await upsertCloudRows(settings, 'sale_items', state.sales.flatMap(sale => (sale.items || []).map((item, index) => ({ shop_id: shopId, local_id: `${sale.id}-${index}-${item.vegetableId}`, sale_id: saleMap.get(sale.id), sale_local_id: sale.id, vegetable_id: vegMap.get(item.vegetableId) || null, vegetable_local_id: item.vegetableId, name: item.name, hindi_name: item.hindiName, unit: item.unit, qty: item.qty, rate: item.rate, discount: item.discount, device_id: 'desktop' }))).filter(item => item.sale_id))
  const purchases = await upsertCloudRows(settings, 'purchases', state.purchases.map(purchase => ({ shop_id: shopId, local_id: purchase.id, date: purchase.date, supplier_id: supplierMap.get(purchase.supplierId) || null, supplier_local_id: purchase.supplierId || null, supplier_name: purchase.supplierName, total: purchase.total, paid: purchase.paid, due: purchase.due, device_id: 'desktop' })))
  const purchaseMap = byLocal(purchases)
  await upsertCloudRows(settings, 'purchase_items', state.purchases.flatMap(purchase => (purchase.items || []).map((item, index) => ({ shop_id: shopId, local_id: `${purchase.id}-${index}-${item.vegetableId}`, purchase_id: purchaseMap.get(purchase.id), purchase_local_id: purchase.id, vegetable_id: vegMap.get(item.vegetableId) || null, vegetable_local_id: item.vegetableId, name: item.name, qty: item.qty, rate: item.rate, device_id: 'desktop' }))).filter(item => item.purchase_id))
  await upsertCloudRows(settings, 'payments', state.payments.map(payment => ({ shop_id: shopId, local_id: payment.id, date: payment.date, party_type: payment.partyType, party_id: payment.partyType === 'customer' ? (customerMap.get(payment.partyId) || null) : (supplierMap.get(payment.partyId) || null), party_local_id: payment.partyId || null, party_name: payment.partyName, amount: payment.amount, mode: payment.mode, note: payment.note, device_id: 'desktop' })))
  await upsertCloudRows(settings, 'expenses', state.expenses.map(expense => ({ shop_id: shopId, local_id: expense.id, date: expense.date, title: expense.title, amount: expense.amount, note: expense.note, device_id: 'desktop' })))
  await upsertCloudRows(settings, 'returns', (state.returns || []).map(ret => ({ shop_id: shopId, local_id: ret.id, date: ret.date, sale_id: saleMap.get(ret.saleId) || null, sale_local_id: ret.saleId, bill_no: ret.billNo, vegetable_id: vegMap.get(ret.vegetableId) || null, vegetable_local_id: ret.vegetableId, vegetable_name: ret.vegetableName, qty: ret.qty, unit: ret.unit, rate: ret.rate, amount: ret.amount, reason: ret.reason, device_id: 'desktop' })))
  await upsertCloudRows(settings, 'stock_logs', state.stockLogs.map(log => ({ shop_id: shopId, local_id: log.id, date: log.date, vegetable_id: vegMap.get(log.vegetableId) || null, vegetable_local_id: log.vegetableId, vegetable_name: log.vegetableName, type: log.type, qty: log.qty, before_stock: log.beforeStock, after_stock: log.afterStock, note: log.note, device_id: 'desktop' })))
  await upsertCloudRows(settings, 'sync_devices', [{ shop_id: shopId, device_id: 'desktop', device_name: 'Desktop Counter', last_sync_at: ts }], 'shop_id,device_id')
  return `Auto push complete: ${state.vegetables.length} vegetables, ${state.sales.length} sales, ${state.purchases.length} purchases.`
}
