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

async function fetchCloudTable(settings: any, table: string) {
  const base = settings.supabaseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/rest/v1/${table}?shop_id=eq.${settings.cloudShopId}&deleted_at=is.null&select=*`, { headers: cloudHeadersFor(settings, settings.cloudAccessToken) })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message || `${table} fetch failed: ${res.status}`)
  return Array.isArray(data) ? data : []
}

export async function fetchCloudState(baseState: AppState, settings: any): Promise<AppState> {
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) throw new Error('Missing Supabase URL or anon key')
  if (!settings.cloudAccessToken) throw new Error('Sign in first')
  if (!settings.cloudShopId) throw new Error('Select/connect a cloud shop first')
  const base = settings.supabaseUrl.replace(/\/$/, '')
  const nowIso = () => new Date().toISOString()
  const shopRes = await fetch(`${base}/rest/v1/shops?id=eq.${settings.cloudShopId}&select=*`, { headers: cloudHeadersFor(settings, settings.cloudAccessToken) })
  const shopRows = await shopRes.json().catch(() => [])
  if (!shopRes.ok) throw new Error(shopRows?.message || `Shop fetch failed: ${shopRes.status}`)
  const shop = Array.isArray(shopRows) ? shopRows[0] : null

  const [vegetableRows, customerRows, supplierRows, saleRows, saleItemRows, purchaseRows, purchaseItemRows, paymentRows, expenseRows, returnRows, stockLogRows] = await Promise.all([
    fetchCloudTable(settings, 'vegetables'), fetchCloudTable(settings, 'customers'), fetchCloudTable(settings, 'suppliers'), fetchCloudTable(settings, 'sales'), fetchCloudTable(settings, 'sale_items'), fetchCloudTable(settings, 'purchases'), fetchCloudTable(settings, 'purchase_items'), fetchCloudTable(settings, 'payments'), fetchCloudTable(settings, 'expenses'), fetchCloudTable(settings, 'returns'), fetchCloudTable(settings, 'stock_logs')
  ])

  const saleItemsBySale = new Map<string, any[]>()
  saleItemRows.forEach(item => { const key = item.sale_local_id || item.sale_id; saleItemsBySale.set(key, [...(saleItemsBySale.get(key) || []), item]) })
  const purchaseItemsByPurchase = new Map<string, any[]>()
  purchaseItemRows.forEach(item => { const key = item.purchase_local_id || item.purchase_id; purchaseItemsByPurchase.set(key, [...(purchaseItemsByPurchase.get(key) || []), item]) })

  return {
    ...baseState,
    settings: {
      ...baseState.settings,
      name: shop?.name || baseState.settings.name,
      owner: shop?.owner || baseState.settings.owner,
      address: shop?.address || baseState.settings.address,
      phone: shop?.phone || baseState.settings.phone,
      upiId: shop?.upi_id || baseState.settings.upiId,
      receiptSize: shop?.receipt_size || baseState.settings.receiptSize,
      receiptFooter: shop?.receipt_footer || baseState.settings.receiptFooter,
      supabaseUrl: settings.supabaseUrl,
      supabaseAnonKey: settings.supabaseAnonKey,
      cloudShopId: settings.cloudShopId,
      cloudEmail: settings.cloudEmail,
      cloudUserId: settings.cloudUserId,
      cloudAccessToken: settings.cloudAccessToken,
      cloudRefreshToken: settings.cloudRefreshToken,
      cloudRole: settings.cloudRole || baseState.settings.cloudRole,
      cloudSyncEnabled: settings.cloudSyncEnabled
    },
    vegetables: vegetableRows.map(v => ({ id: v.local_id || v.id, name: v.name || '', hindiName: v.hindi_name || '', category: v.category || '', unit: v.unit || 'kg', barcode: v.barcode || '', purchaseRate: Number(v.purchase_rate || 0), sellingRate: Number(v.selling_rate || 0), stock: Number(v.stock || 0), lowStock: Number(v.low_stock || 0), wastagePercent: Number(v.wastage_percent || 0), active: v.active !== false, lastUpdated: v.updated_at || nowIso() })),
    customers: customerRows.map(c => ({ id: c.local_id || c.id, name: c.name || '', phone: c.phone || '', address: c.address || '', balance: Number(c.balance || 0) })),
    suppliers: supplierRows.map(sup => ({ id: sup.local_id || sup.id, name: sup.name || '', phone: sup.phone || '', address: sup.address || '' })),
    sales: saleRows.map(sale => ({ id: sale.local_id || sale.id, billNo: sale.bill_no || '', date: sale.date || nowIso(), customerId: sale.customer_local_id || '', customerName: sale.customer_name || '', customerPhone: sale.customer_phone || '', subtotal: Number(sale.subtotal || 0), discount: Number(sale.discount || 0), roundOff: Number(sale.round_off || 0), total: Number(sale.total || 0), paid: Number(sale.paid || 0), due: Number(sale.due || 0), paymentMode: sale.payment_mode || 'Cash', cancelledAt: sale.cancelled_at || undefined, cancelReason: sale.cancel_reason || undefined, items: (saleItemsBySale.get(sale.local_id || sale.id) || []).map(item => ({ vegetableId: item.vegetable_local_id || '', name: item.name || '', hindiName: item.hindi_name || '', unit: item.unit || 'kg', qty: Number(item.qty || 0), rate: Number(item.rate || 0), discount: Number(item.discount || 0) })) })),
    purchases: purchaseRows.map(purchase => ({ id: purchase.local_id || purchase.id, date: purchase.date || nowIso(), supplierId: purchase.supplier_local_id || '', supplierName: purchase.supplier_name || '', total: Number(purchase.total || 0), paid: Number(purchase.paid || 0), due: Number(purchase.due || 0), items: (purchaseItemsByPurchase.get(purchase.local_id || purchase.id) || []).map(item => ({ vegetableId: item.vegetable_local_id || '', name: item.name || '', qty: Number(item.qty || 0), rate: Number(item.rate || 0) })) })),
    payments: paymentRows.map(payment => ({ id: payment.local_id || payment.id, date: payment.date || nowIso(), partyType: payment.party_type || 'customer', partyId: payment.party_local_id || '', partyName: payment.party_name || '', amount: Number(payment.amount || 0), mode: payment.mode || 'Cash', note: payment.note || '' })),
    expenses: expenseRows.map(expense => ({ id: expense.local_id || expense.id, date: expense.date || nowIso(), title: expense.title || '', amount: Number(expense.amount || 0), note: expense.note || '' })),
    returns: returnRows.map(ret => ({ id: ret.local_id || ret.id, date: ret.date || nowIso(), saleId: ret.sale_local_id || '', billNo: ret.bill_no || '', vegetableId: ret.vegetable_local_id || '', vegetableName: ret.vegetable_name || '', qty: Number(ret.qty || 0), unit: ret.unit || 'kg', rate: Number(ret.rate || 0), amount: Number(ret.amount || 0), reason: ret.reason || '' })),
    stockLogs: stockLogRows.map(log => ({ id: log.local_id || log.id, date: log.date || nowIso(), vegetableId: log.vegetable_local_id || '', vegetableName: log.vegetable_name || '', type: log.type || 'ADJUSTMENT', qty: Number(log.qty || 0), beforeStock: Number(log.before_stock || 0), afterStock: Number(log.after_stock || 0), note: log.note || '' })),
    billCounter: Math.max(1, ...saleRows.map(row => Number(String(row.bill_no || '').replace(/\D/g, '')) || 0)) + 1
  }
}

export async function getCloudMemberships(settings: any) {
  if (!settings.supabaseUrl || !settings.supabaseAnonKey || !settings.cloudAccessToken) throw new Error('Sign in first')
  const base = settings.supabaseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/rest/v1/shop_users?select=shop_id,role,shops(id,name)&user_id=eq.${settings.cloudUserId}`, { headers: cloudHeadersFor(settings, settings.cloudAccessToken) })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message || `Membership fetch failed: ${res.status}`)
  return Array.isArray(data) ? data : []
}
