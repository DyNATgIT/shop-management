import { AppState, AuditLog } from './types'

const makeLog = (type: AuditLog['type'], message: string): AuditLog => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  date: new Date().toISOString(),
  type,
  message
})

const ids = (rows: { id: string }[] = []) => new Set(rows.map(row => row.id))

export function inferAuditLogs(prev: AppState, next: AppState): AuditLog[] {
  const logs: AuditLog[] = []
  const prevSales = ids(prev.sales)
  const prevPurchases = ids(prev.purchases)
  const prevPayments = ids(prev.payments)
  const prevExpenses = ids(prev.expenses)
  const prevReturns = ids(prev.returns || [])
  const prevVegetables = ids(prev.vegetables)
  const prevCustomers = ids(prev.customers)
  const prevSuppliers = ids(prev.suppliers)

  for (const sale of next.sales || []) if (!prevSales.has(sale.id)) logs.push(makeLog('sale', `Bill created: ${sale.billNo} (${sale.customerName})`))
  for (const sale of next.sales || []) {
    const oldSale = prev.sales.find(x => x.id === sale.id)
    if (sale.cancelledAt && !oldSale?.cancelledAt) logs.push(makeLog('cancel', `Bill cancelled: ${sale.billNo}. ${sale.cancelReason || ''}`))
  }
  for (const ret of next.returns || []) if (!prevReturns.has(ret.id)) logs.push(makeLog('return', `Item returned: ${ret.billNo} ${ret.vegetableName} ${ret.qty} ${ret.unit}`))
  for (const purchase of next.purchases || []) if (!prevPurchases.has(purchase.id)) logs.push(makeLog('purchase', `Purchase added: ${purchase.supplierName} ${purchase.total}`))
  for (const payment of next.payments || []) if (!prevPayments.has(payment.id)) logs.push(makeLog('payment', `Payment recorded: ${payment.partyName} ${payment.amount}`))
  for (const expense of next.expenses || []) if (!prevExpenses.has(expense.id)) logs.push(makeLog('expense', `Expense added: ${expense.title} ${expense.amount}`))
  for (const veg of next.vegetables || []) if (!prevVegetables.has(veg.id)) logs.push(makeLog('inventory', `Vegetable added: ${veg.name}`))
  for (const c of next.customers || []) if (!prevCustomers.has(c.id)) logs.push(makeLog('customer', `Customer added: ${c.name}`))
  for (const sup of next.suppliers || []) if (!prevSuppliers.has(sup.id)) logs.push(makeLog('supplier', `Supplier added: ${sup.name}`))

  if (next.lastBackupAt && next.lastBackupAt !== prev.lastBackupAt) logs.push(makeLog('backup', 'JSON backup created'))
  if (next.settings.lastCloudSyncStatus && next.settings.lastCloudSyncStatus !== prev.settings.lastCloudSyncStatus) logs.push(makeLog('sync', `Cloud sync: ${next.settings.lastCloudSyncStatus}`))
  if (next.settings.ownerPinEnabled !== prev.settings.ownerPinEnabled) logs.push(makeLog('security', `Owner PIN ${next.settings.ownerPinEnabled ? 'enabled' : 'disabled'}`))
  if (next.settings.ownerPinHash && next.settings.ownerPinHash !== prev.settings.ownerPinHash) logs.push(makeLog('security', 'Owner PIN updated'))

  return logs
}

export function withAuditLogs(prev: AppState, next: AppState): AppState {
  const inferred = inferAuditLogs(prev, next)
  if (!inferred.length) return next
  return {
    ...next,
    auditLogs: [...inferred, ...(next.auditLogs || [])].slice(0, 500)
  }
}
