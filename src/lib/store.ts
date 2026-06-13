import { AppState, CartItem, PaymentMode, StockLogType, Unit } from './types'

export const STORAGE_KEY = 'vegetable-shop-manager-v1'
export const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
export const today = () => new Date().toISOString().slice(0, 10)
export const now = () => new Date().toISOString()
export const money = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
export const number = (value: string | number) => Number(value) || 0
export const unitLabel = (unit: Unit) => unit

export const demoState: AppState = {
  settings: {
    name: 'Fresh Sabzi Store', owner: 'Owner Name', address: 'Main Market, Your City', phone: '9876543210', language: 'en', receiptSize: '80mm', defaultLowStockKg: 5, printHindi: true, upiId: '', showUpiOnReceipt: false, receiptFooter: 'Thank you! धन्यवाद!', supabaseUrl: 'https://bthabwdutxntytevsled.supabase.co', supabaseAnonKey: '', cloudShopId: '', cloudEmail: '', cloudUserId: '', cloudRole: '', cloudAccessToken: '', cloudRefreshToken: '', lastCloudSyncAt: '', lastCloudPushAt: '', lastCloudPullAt: '', lastCloudSyncStatus: '', lastCloudSyncMessage: '', autoCloudPushEnabled: false, autoCloudPushMinutes: 10, lastAutoCloudPushAt: '', cloudSyncEnabled: false, ownerPinEnabled: false, ownerPin: '', ownerPinHash: '', staffAllowedTabs: ['dashboard', 'billing', 'customers', 'payments', 'wastage']
  },
  vegetables: [
    { id: 'v1', name: 'Tomato', hindiName: 'टमाटर', category: 'Vegetables', unit: 'kg', barcode: 'TOM', purchaseRate: 24, sellingRate: 35, stock: 32, lowStock: 5, wastagePercent: 4, active: true, lastUpdated: now() },
    { id: 'v2', name: 'Potato', hindiName: 'आलू', category: 'Roots', unit: 'kg', barcode: 'POT', purchaseRate: 18, sellingRate: 28, stock: 55, lowStock: 10, wastagePercent: 2, active: true, lastUpdated: now() },
    { id: 'v3', name: 'Onion', hindiName: 'प्याज', category: 'Roots', unit: 'kg', barcode: 'ONI', purchaseRate: 22, sellingRate: 32, stock: 48, lowStock: 10, wastagePercent: 3, active: true, lastUpdated: now() },
    { id: 'v4', name: 'Green Chilli', hindiName: 'हरी मिर्च', category: 'Vegetables', unit: 'kg', barcode: 'CHI', purchaseRate: 55, sellingRate: 80, stock: 5, lowStock: 2, wastagePercent: 8, active: true, lastUpdated: now() },
    { id: 'v5', name: 'Coriander', hindiName: 'धनिया', category: 'Leafy', unit: 'bunch', barcode: 'COR', purchaseRate: 5, sellingRate: 10, stock: 40, lowStock: 10, wastagePercent: 15, active: true, lastUpdated: now() },
    { id: 'v6', name: 'Banana', hindiName: 'केला', category: 'Fruits', unit: 'dozen', barcode: 'BAN', purchaseRate: 38, sellingRate: 55, stock: 20, lowStock: 5, wastagePercent: 5, active: true, lastUpdated: now() }
  ],
  customers: [
    { id: 'c1', name: 'Ramesh Kumar', phone: '9876543210', address: 'Near Temple', balance: 0 }
  ],
  suppliers: [
    { id: 's1', name: 'Azadpur Mandi Supplier', phone: '9000000000', address: 'Mandi' }
  ],
  sales: [], purchases: [], expenses: [], stockLogs: [], payments: [], returns: [], auditLogs: [], billCounter: 1, lastBackupAt: ''
}

export const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return demoState
    const parsed = JSON.parse(raw)
    return { ...demoState, ...parsed, settings: { ...demoState.settings, ...(parsed.settings || {}) } }
  } catch {
    return demoState
  }
}

export const saveState = (state: AppState) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

export const calcCart = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0)
  const discount = items.reduce((sum, item) => sum + item.discount, 0)
  const rawTotal = Math.max(0, subtotal - discount)
  const rounded = Math.round(rawTotal)
  return { subtotal, discount, roundOff: rounded - rawTotal, total: rounded }
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export const downloadBackup = (state: AppState) => {
  const backupState = { ...state, lastBackupAt: now() }
  downloadBlob(new Blob([JSON.stringify(backupState, null, 2)], { type: 'application/json' }), `vegetable-shop-backup-${today()}.json`)
  return backupState
}

export const hasBackupToday = (state: AppState) => Boolean(state.lastBackupAt && state.lastBackupAt.slice(0, 10) === today())

export const exportCsv = (rows: any[], filename: string) => {
  if (!rows.length) return alert('No data to export')
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename)
}

export const makeStockLog = (vegetableId: string, vegetableName: string, type: StockLogType, qty: number, beforeStock: number, note: string) => ({
  id: id(), date: now(), vegetableId, vegetableName, type, qty, beforeStock, afterStock: beforeStock + qty, note
})

export const paymentModes: PaymentMode[] = ['Cash', 'UPI', 'Card', 'Credit', 'Mixed']
export const units: Unit[] = ['kg', 'g', 'piece', 'dozen', 'bunch', 'crate']
