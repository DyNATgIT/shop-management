import { useEffect, useState } from 'react'
import { BarChart3, Boxes, CreditCard, Keyboard, Languages, PackagePlus, Receipt, Settings, ShoppingCart, TrendingDown, Truck, Users } from 'lucide-react'
import { tFor } from './lib/i18n'
import { AppState } from './lib/types'
import { demoState, loadState, saveState } from './lib/store'
import { withAuditLogs } from './lib/audit'
import { Button } from './components/ui'
import Dashboard from './components/Dashboard'
import Billing from './components/Billing'
import Inventory from './components/Inventory'
import DailyRates from './components/DailyRates'
import Purchases from './components/Purchases'
import Wastage from './components/Wastage'
import { Customers, Suppliers } from './components/Parties'
import Payments from './components/Payments'
import Reports from './components/Reports'
import AppSettings from './components/Settings'
import PinGate from './components/PinGate'
import AutoCloudPush from './components/AutoCloudPush'

type Tab = 'dashboard' | 'billing' | 'inventory' | 'rates' | 'purchases' | 'wastage' | 'customers' | 'suppliers' | 'payments' | 'reports' | 'settings'

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [ownerUnlocked, setOwnerUnlocked] = useState(false)
  const t = tFor(state.settings.language)
  const patch = (fn: (state: AppState) => AppState) => setState(prev => {
    const next = withAuditLogs(prev, fn(prev))
    saveState(next)
    window.desktopApp?.setAppState?.(next).catch(err => console.error('SQLite save failed', err))
    return next
  })
  const protectedTabs: Tab[] = ['reports', 'settings']
  const ownerAccessRequired = Boolean(state.settings.ownerPinEnabled && protectedTabs.includes(tab) && !ownerUnlocked)
  const isStaffMode = Boolean(state.settings.ownerPinEnabled && !ownerUnlocked)
  useEffect(() => {
    let cancelled = false
    const api = window.desktopApp
    if (!api?.getAppState) return
    api.getAppState().then(async dbState => {
      if (cancelled) return
      if (dbState) {
        const merged = { ...demoState, ...dbState, settings: { ...demoState.settings, ...(dbState.settings || {}) } }
        setState(merged)
        saveState(merged)
      } else {
        await api.setAppState(state).catch(err => console.error('SQLite migration failed', err))
      }
      api.ensureDailyBackup?.().then(result => console.log('Daily SQLite backup check:', result)).catch(err => console.error('Daily SQLite backup failed', err))
    }).catch(err => console.error('SQLite load failed', err))
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); setTab('billing') }
      if (e.key === 'F3') { e.preventDefault(); setTab('rates') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const nav = [
    ['dashboard', t.dashboard, BarChart3], ['billing', t.billing, Receipt], ['inventory', t.inventory, Boxes], ['rates', state.settings.language === 'hi' ? 'दैनिक रेट' : 'Daily Rates', Keyboard], ['purchases', t.purchases, PackagePlus], ['wastage', t.wastage, TrendingDown], ['customers', t.customers, Users], ['suppliers', t.suppliers, Truck], ['payments', t.payments, CreditCard], ['reports', t.reports, ShoppingCart], ['settings', t.settings, Settings]
  ] as const

  return <div className="app">
    <header className="topbar">
      <div className="head-row">
        <div><h1>{state.settings.name || t.appName}</h1><p>{t.tagline}</p></div>
        <div className="head-actions"><Button variant="secondary" onClick={() => patch(s => ({ ...s, settings: { ...s.settings, language: s.settings.language === 'en' ? 'hi' : 'en' } }))}><Languages size={16}/>{state.settings.language === 'en' ? 'हिन्दी' : 'English'}</Button>{isStaffMode && <span className="mode-badge staff">Staff Mode</span>}{state.settings.ownerPinEnabled && ownerUnlocked && <span className="mode-badge owner">Owner Mode</span>}{state.settings.ownerPinEnabled && ownerUnlocked && <Button variant="secondary" onClick={() => setOwnerUnlocked(false)}>Lock Owner</Button>}<span className="offline">Offline</span></div>
      </div>
      <nav>{nav.map(([key, label, Icon]) => <button key={key} onClick={() => setTab(key)} className={tab === key ? 'active' : ''}><Icon size={16}/>{label}</button>)}</nav>
    </header>
    <AutoCloudPush s={state} patch={patch} />
    <main>
      {tab === 'dashboard' && <Dashboard s={state} patch={patch} t={t} ownerUnlocked={!isStaffMode}/>} 
      {tab === 'billing' && <Billing s={state} patch={patch} t={t}/>} 
      {tab === 'inventory' && <Inventory s={state} patch={patch} t={t}/>} 
      {tab === 'rates' && <DailyRates s={state} patch={patch} t={t}/>} 
      {tab === 'purchases' && <Purchases s={state} patch={patch} t={t}/>} 
      {tab === 'wastage' && <Wastage s={state} patch={patch} t={t}/>} 
      {tab === 'customers' && <Customers s={state} patch={patch} t={t}/>} 
      {tab === 'suppliers' && <Suppliers s={state} patch={patch} t={t}/>} 
      {tab === 'payments' && <Payments s={state} patch={patch} t={t}/>} 
      {ownerAccessRequired && <PinGate settings={state.settings} onUnlock={() => setOwnerUnlocked(true)} />}
      {!ownerAccessRequired && tab === 'reports' && <Reports s={state} patch={patch} t={t}/>} 
      {!ownerAccessRequired && tab === 'settings' && <AppSettings s={state} patch={patch} t={t} onLockOwner={() => setOwnerUnlocked(false)} />} 
    </main>
  </div>
}


