import { useState } from 'react'
import { 
  Package, 
  Receipt, 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  Settings as SettingsIcon 
} from 'lucide-react'

import Inventory from './components/Inventory'
import Billing from './components/Billing'
import Dashboard from './components/Dashboard'
import Reports from './components/Reports'
import CustomerManagement from './components/CustomerManagement'
import PurchaseEntry from './components/PurchaseEntry'
import ShopSettings from './components/Settings'
import PaymentModes from './components/PaymentModes'
import StockAdjustment from './components/StockAdjustment'

type Tab = 'dashboard' | 'inventory' | 'billing' | 'reports' | 'customers' | 'purchase' | 'payments' | 'adjustment' | 'settings'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Shop Manager</h1>
              <p className="text-sm text-gray-500">Inventory &amp; Billing</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Offline Mode</div>
        </div>

        <div className="max-w-7xl mx-auto px-6 flex flex-wrap gap-1 border-t text-sm">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-3 flex items-center gap-1 border-b-2 ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('inventory')} className={`px-4 py-3 border-b-2 ${activeTab === 'inventory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            Inventory
          </button>
          <button onClick={() => setActiveTab('billing')} className={`px-4 py-3 border-b-2 ${activeTab === 'billing' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            Billing
          </button>
          <button onClick={() => setActiveTab('reports')} className={`px-4 py-3 flex items-center gap-1 border-b-2 ${activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <TrendingUp size={16} /> Reports
          </button>
          <button onClick={() => setActiveTab('customers')} className={`px-4 py-3 flex items-center gap-1 border-b-2 ${activeTab === 'customers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <Users size={16} /> Customers
          </button>
          <button onClick={() => setActiveTab('purchase')} className={`px-4 py-3 flex items-center gap-1 border-b-2 ${activeTab === 'purchase' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <ShoppingCart size={16} /> Purchase
          </button>
          <button onClick={() => setActiveTab('payments')} className={`px-4 py-3 flex items-center gap-1 border-b-2 ${activeTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            Payments
          </button>
          <button onClick={() => setActiveTab('adjustment')} className={`px-4 py-3 flex items-center gap-1 border-b-2 ${activeTab === 'adjustment' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            Stock Adj.
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-3 flex items-center gap-1 border-b-2 ${activeTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <SettingsIcon size={16} /> Settings
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'billing' && <Billing />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'customers' && <CustomerManagement />}
        {activeTab === 'purchase' && <PurchaseEntry />}
        {activeTab === 'payments' && <PaymentModes />}
        {activeTab === 'adjustment' && <StockAdjustment />}
        {activeTab === 'settings' && <ShopSettings />}
      </main>
    </div>
  )
}
