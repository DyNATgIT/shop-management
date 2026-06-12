export type Language = 'en' | 'hi'
export type Unit = 'kg' | 'g' | 'piece' | 'dozen' | 'bunch' | 'crate'
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Credit' | 'Mixed'
export type StockLogType = 'OPENING' | 'PURCHASE' | 'SALE' | 'WASTAGE' | 'RETURN' | 'ADJUSTMENT'

export interface ShopSettings {
  name: string
  owner: string
  address: string
  phone: string
  language: Language
  receiptSize: '58mm' | '80mm'
  defaultLowStockKg: number
  printHindi: boolean
  upiId: string
  showUpiOnReceipt: boolean
  receiptFooter: string
  supabaseUrl: string
  supabaseAnonKey: string
  cloudShopId: string
  cloudEmail: string
  cloudUserId: string
  cloudAccessToken: string
  cloudRefreshToken: string
  lastCloudSyncAt: string
  lastCloudPushAt: string
  lastCloudPullAt: string
  lastCloudSyncStatus: string
  lastCloudSyncMessage: string
  autoCloudPushEnabled: boolean
  autoCloudPushMinutes: number
  lastAutoCloudPushAt: string
  cloudSyncEnabled: boolean
  ownerPinEnabled: boolean
  ownerPin: string
  ownerPinHash: string
}


export interface Vegetable {
  id: string
  name: string
  hindiName: string
  category: string
  unit: Unit
  barcode: string
  purchaseRate: number
  sellingRate: number
  stock: number
  lowStock: number
  wastagePercent: number
  active: boolean
  lastUpdated: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  address: string
  balance: number
}

export interface Supplier {
  id: string
  name: string
  phone: string
  address: string
}

export interface CartItem {
  vegetableId: string
  name: string
  hindiName: string
  unit: Unit
  qty: number
  rate: number
  discount: number
}

export interface Sale {
  id: string
  billNo: string
  date: string
  customerId: string
  customerName: string
  customerPhone: string
  items: CartItem[]
  subtotal: number
  discount: number
  roundOff: number
  total: number
  paid: number
  due: number
  paymentMode: PaymentMode
  cancelledAt?: string
  cancelReason?: string
}

export interface PurchaseItem {
  vegetableId: string
  name: string
  qty: number
  rate: number
}

export interface Purchase {
  id: string
  date: string
  supplierId: string
  supplierName: string
  items: PurchaseItem[]
  total: number
  paid: number
  due: number
}

export interface Expense {
  id: string
  date: string
  title: string
  amount: number
  note: string
}

export interface StockLog {
  id: string
  date: string
  vegetableId: string
  vegetableName: string
  type: StockLogType
  qty: number
  beforeStock: number
  afterStock: number
  note: string
}

export interface Payment {
  id: string
  date: string
  partyType: 'customer' | 'supplier'
  partyId: string
  partyName: string
  amount: number
  mode: PaymentMode
  note: string
}

export interface AppState {
  settings: ShopSettings
  vegetables: Vegetable[]
  customers: Customer[]
  suppliers: Supplier[]
  sales: Sale[]
  purchases: Purchase[]
  expenses: Expense[]
  stockLogs: StockLog[]
  payments: Payment[]
  billCounter: number
  lastBackupAt?: string
}

