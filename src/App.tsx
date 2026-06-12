import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, Boxes, CreditCard, Keyboard, Languages, PackagePlus, Receipt, Settings, ShoppingCart, Trash2, TrendingDown, Truck, Users } from 'lucide-react'
import { tFor } from './lib/i18n'
import { AppState, CartItem, Customer, Expense, Payment, PaymentMode, Purchase, Supplier, Vegetable } from './lib/types'
import { calcCart, demoState, downloadBlob, exportCsv, id, loadState, makeStockLog, money, now, number, paymentModes, saveState, STORAGE_KEY, today, units } from './lib/store'
import { printSale } from './lib/print'
import { Button, Card, Input, Metric, Select, Textarea } from './components/ui'

type Tab = 'dashboard' | 'billing' | 'inventory' | 'rates' | 'purchases' | 'wastage' | 'customers' | 'suppliers' | 'payments' | 'reports' | 'settings'

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [tab, setTab] = useState<Tab>('dashboard')
  const t = tFor(state.settings.language)
  const patch = (fn: (state: AppState) => AppState) => setState(prev => { const next = fn(prev); saveState(next); return next })
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
        <div className="head-actions"><Button variant="secondary" onClick={() => patch(s => ({ ...s, settings: { ...s.settings, language: s.settings.language === 'en' ? 'hi' : 'en' } }))}><Languages size={16}/>{state.settings.language === 'en' ? 'हिन्दी' : 'English'}</Button><span className="offline">Offline</span></div>
      </div>
      <nav>{nav.map(([key, label, Icon]) => <button key={key} onClick={() => setTab(key)} className={tab === key ? 'active' : ''}><Icon size={16}/>{label}</button>)}</nav>
    </header>
    <main>
      {tab === 'dashboard' && <Dashboard s={state} t={t}/>} 
      {tab === 'billing' && <Billing s={state} patch={patch} t={t}/>} 
      {tab === 'inventory' && <Inventory s={state} patch={patch} t={t}/>} 
      {tab === 'rates' && <DailyRates s={state} patch={patch} t={t}/>} 
      {tab === 'purchases' && <Purchases s={state} patch={patch} t={t}/>} 
      {tab === 'wastage' && <Wastage s={state} patch={patch} t={t}/>} 
      {tab === 'customers' && <Customers s={state} patch={patch} t={t}/>} 
      {tab === 'suppliers' && <Suppliers s={state} patch={patch} t={t}/>} 
      {tab === 'payments' && <Payments s={state} patch={patch} t={t}/>} 
      {tab === 'reports' && <Reports s={state} t={t}/>} 
      {tab === 'settings' && <AppSettings s={state} patch={patch} t={t}/>} 
    </main>
  </div>
}

function sameDay(date: string) { return new Date(date).toDateString() === new Date().toDateString() }

function Dashboard({ s, t }: any) {
  const todaySales = s.sales.filter((x: any) => sameDay(x.date))
  const todayPurchases = s.purchases.filter((x: any) => sameDay(x.date))
  const todayExpenses = s.expenses.filter((x: any) => sameDay(x.date))
  const low = s.vegetables.filter((v: Vegetable) => v.active && v.stock <= v.lowStock)
  const stockValue = s.vegetables.reduce((sum: number, v: Vegetable) => sum + v.stock * v.purchaseRate, 0)
  const due = s.customers.reduce((sum: number, c: Customer) => sum + c.balance, 0)
  return <div className="space">
    <div className="metrics"><Metric title={t.todaySales} value={money(todaySales.reduce((a: number, x: any) => a + x.total, 0))}/><Metric title={t.billsToday} value={String(todaySales.length)} tone="green"/><Metric title={t.stockValue} value={money(stockValue)} tone="amber"/><Metric title={t.customerDue} value={money(due)} tone="red"/></div>
    <div className="grid2"><Card className="pad"><h2>{t.lowStock}</h2>{low.length ? low.map((v: Vegetable) => <div className="list-row" key={v.id}><span>{v.hindiName} / {v.name}</span><b className="red">{v.stock} {v.unit}</b></div>) : <p className="muted">{t.freshStock}</p>}</Card><Card className="pad"><h2>{t.dailySummary}</h2><div className="list-row"><span>{t.todaySales}</span><b>{money(todaySales.reduce((a: number, x: any) => a + x.total, 0))}</b></div><div className="list-row"><span>{t.purchases}</span><b>{money(todayPurchases.reduce((a: number, x: any) => a + x.total, 0))}</b></div><div className="list-row"><span>{t.expense}</span><b>{money(todayExpenses.reduce((a: number, x: any) => a + x.amount, 0))}</b></div></Card></div>
    <Card className="pad"><h2>{t.recentBills}</h2><Table headers={['Bill', t.customer, t.total, t.paymentMode]} rows={s.sales.slice(0, 8).map((x: any) => [x.billNo, x.customerName, money(x.total), x.paymentMode])}/></Card>
  </div>
}

function Billing({ s, patch, t }: { s: AppState, patch: (fn: (s: AppState) => AppState) => void, t: any }) {
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [mode, setMode] = useState<PaymentMode>('Cash')
  const [paid, setPaid] = useState(0)
  const [selectedVeg, setSelectedVeg] = useState<Vegetable | null>(null)
  const [selectedQty, setSelectedQty] = useState(1)
  const [selectedDiscount, setSelectedDiscount] = useState(0)
  const totals = useMemo(() => calcCart(cart), [cart])

  const categories = useMemo(() => ['All', ...Array.from(new Set(s.vegetables.filter(v => v.active).map(v => v.category || 'Other')))], [s.vegetables])
  const categoryVegetables = s.vegetables
    .filter(v => v.active && (category === 'All' || v.category === category))
    .sort((a, b) => a.name.localeCompare(b.name))
  const filtered = query ? s.vegetables.filter(v => v.active && `${v.name} ${v.hindiName} ${v.barcode}`.toLowerCase().includes(query.toLowerCase())).slice(0, 10) : []
  const quickQty = selectedVeg?.unit === 'kg' ? [0.25, 0.5, 1, 2, 5] : selectedVeg?.unit === 'g' ? [100, 250, 500, 1000] : [1, 2, 5, 10]

  const openQty = (v: Vegetable) => {
    setSelectedVeg(v)
    setSelectedQty(v.unit === 'kg' ? 1 : v.unit === 'g' ? 250 : 1)
    setSelectedDiscount(0)
    setQuery('')
  }
  const addItem = (v: Vegetable, qty = 1, discount = 0) => {
    setCart(items => items.some(i => i.vegetableId === v.id)
      ? items.map(i => i.vegetableId === v.id ? { ...i, qty: Number((i.qty + qty).toFixed(2)), discount: Number((i.discount + discount).toFixed(2)) } : i)
      : [...items, { vegetableId: v.id, name: v.name, hindiName: v.hindiName, unit: v.unit, qty, rate: v.sellingRate, discount }])
    setSelectedVeg(null)
    setSelectedQty(1)
    setSelectedDiscount(0)
    setTimeout(() => searchRef.current?.focus(), 0)
  }
  const chooseCustomer = (cid: string) => { setCustomerId(cid); const c = s.customers.find(x => x.id === cid); setCustomerName(c?.name || ''); setCustomerPhone(c?.phone || '') }
  const save = (shouldPrint: boolean) => {
    if (!cart.length) return alert('Add vegetables first')
    const finalPaid = mode === 'Credit' ? 0 : (paid || totals.total)
    const sale = { id: id(), billNo: `BILL-${String(s.billCounter).padStart(5, '0')}`, date: now(), customerId, customerName: customerName || t.cashCustomer, customerPhone, items: cart, ...totals, paid: finalPaid, due: Math.max(0, totals.total - finalPaid), paymentMode: mode }
    patch(old => ({ ...old, billCounter: old.billCounter + 1, sales: [sale, ...old.sales], vegetables: old.vegetables.map(v => { const item = cart.find(i => i.vegetableId === v.id); return item ? { ...v, stock: Number((v.stock - item.qty).toFixed(2)), lastUpdated: now() } : v }), customers: old.customers.map(c => c.id === customerId ? { ...c, balance: c.balance + sale.due } : c), payments: finalPaid > 0 ? [{ id: id(), date: sale.date, partyType: 'customer', partyId: customerId, partyName: sale.customerName, amount: finalPaid, mode, note: sale.billNo }, ...old.payments] : old.payments, stockLogs: [...cart.map(i => { const v = old.vegetables.find(x => x.id === i.vegetableId)!; return makeStockLog(i.vegetableId, i.name, 'SALE', -i.qty, v.stock, sale.billNo) }), ...old.stockLogs] }))
    if (shouldPrint) printSale(sale, s.settings)
    setCart([]); setCustomerId(''); setCustomerName(''); setCustomerPhone(''); setPaid(0); setMode('Cash')
    setTimeout(() => searchRef.current?.focus(), 0)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'F4') { e.preventDefault(); setMode('Cash'); setPaid(totals.total) }
      if (e.key === 'F5') { e.preventDefault(); save(false) }
      if (e.key === 'F6') { e.preventDefault(); save(true) }
      if (e.key === 'Escape') { e.preventDefault(); selectedVeg ? setSelectedVeg(null) : cart.length && confirm('Clear current bill?') && setCart([]) }
      if (e.key === 'Enter' && selectedVeg) { e.preventDefault(); addItem(selectedVeg, selectedQty, selectedDiscount) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cart, totals.total, mode, paid, customerId, customerName, customerPhone, selectedVeg, selectedQty, selectedDiscount])

  return <div className="billing-grid"><div className="space">
    <Card className="pad"><label>{t.searchVegetable} <small>F2 search • F5 save • F6 print • Esc clear/close</small></label><Input ref={searchRef} autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Tomato / टमाटर / TOM" />{filtered.length > 0 && <div className="search-results">{filtered.map(v => <button key={v.id} onClick={() => openQty(v)}><span><b>{v.hindiName} / {v.name}</b><small>{v.stock} {v.unit} • {money(v.sellingRate)}/{v.unit}</small></span><b>+</b></button>)}</div>}</Card>
    <Card className="pad"><div className="section-head"><div><h2>Quick Billing</h2><p className="muted">Choose category, then click vegetable to enter quantity.</p></div></div><div className="category-tabs">{categories.map(c => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="quick-grid">{categoryVegetables.map(v => <button key={v.id} onClick={() => openQty(v)} className={v.stock <= v.lowStock ? 'low' : ''}><b>{v.hindiName || v.name}</b><small>{v.name}</small><span>{money(v.sellingRate)}/{v.unit}</span><small>Stock: {v.stock} {v.unit}</small></button>)}</div></Card>
    <Card><div className="table-wrap"><table><thead><tr><th>{t.name}</th><th>{t.qty}</th><th>{t.rate}</th><th>{t.discount}</th><th>{t.amount}</th><th></th></tr></thead><tbody>{cart.map((item, idx) => <tr key={item.vegetableId}><td><b>{item.hindiName}</b><small>{item.name}</small></td><td><Input type="number" step="0.01" value={item.qty} onChange={e => setCart(c => c.map((x, n) => n === idx ? { ...x, qty: number(e.target.value) } : x))}/><small>{item.unit}</small></td><td><Input type="number" value={item.rate} onChange={e => setCart(c => c.map((x, n) => n === idx ? { ...x, rate: number(e.target.value) } : x))}/></td><td><Input type="number" value={item.discount} onChange={e => setCart(c => c.map((x, n) => n === idx ? { ...x, discount: number(e.target.value) } : x))}/></td><td><b>{money(item.qty * item.rate - item.discount)}</b></td><td><button className="icon danger-text" onClick={() => setCart(c => c.filter((_, n) => n !== idx))}><Trash2 size={16}/></button></td></tr>)}{!cart.length && <tr><td colSpan={6} className="empty">{t.noData}</td></tr>}</tbody></table></div></Card>
  </div><div className="space"><Card className="pad"><h2>{t.billing}</h2><Select value={customerId} onChange={e => chooseCustomer(e.target.value)}><option value="">{t.cashCustomer}</option>{s.customers.map(c => <option key={c.id} value={c.id}>{c.name} - {money(c.balance)}</option>)}</Select><Input placeholder={t.customer} value={customerName} onChange={e => setCustomerName(e.target.value)}/><Input placeholder={t.phone} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}/><Select value={mode} onChange={e => setMode(e.target.value as PaymentMode)}>{paymentModes.map(m => <option key={m}>{m}</option>)}</Select><Input type="number" placeholder={t.paid} value={paid} onChange={e => setPaid(number(e.target.value))}/></Card><Card className="pad sticky-total"><Line label="Subtotal" value={money(totals.subtotal)}/><Line label={t.discount} value={money(totals.discount)}/><Line label="Round Off" value={money(totals.roundOff)}/><div className="grand"><span>{t.total}</span><b>{money(totals.total)}</b></div><Line label={t.due} value={money(Math.max(0, totals.total - (mode === 'Credit' ? 0 : (paid || totals.total))))}/><Button className="full" onClick={() => save(false)}>{t.save}</Button><Button className="full" variant="secondary" onClick={() => save(true)}>{t.savePrint}</Button></Card></div>

  {selectedVeg && <div className="modal-backdrop" onClick={() => setSelectedVeg(null)}><div className="qty-modal" onClick={e => e.stopPropagation()}><div className="modal-title"><div><h2>{selectedVeg.hindiName || selectedVeg.name}</h2><p>{selectedVeg.name} • {money(selectedVeg.sellingRate)}/{selectedVeg.unit} • Stock {selectedVeg.stock} {selectedVeg.unit}</p></div><button onClick={() => setSelectedVeg(null)}>×</button></div><label>{t.qty}</label><Input autoFocus type="number" step="0.01" value={selectedQty} onChange={e => setSelectedQty(number(e.target.value))}/><div className="qty-chips">{quickQty.map(q => <button key={q} onClick={() => setSelectedQty(q)}>{q} {selectedVeg.unit}</button>)}</div><label>{t.discount}</label><Input type="number" value={selectedDiscount} onChange={e => setSelectedDiscount(number(e.target.value))}/><div className="preview-total"><span>{t.amount}</span><b>{money(selectedQty * selectedVeg.sellingRate - selectedDiscount)}</b></div><div className="modal-actions"><Button variant="secondary" onClick={() => setSelectedVeg(null)}>{t.cancel}</Button><Button onClick={() => addItem(selectedVeg, selectedQty, selectedDiscount)}>{t.add}</Button></div></div></div>}
  </div>
}
function Line({ label, value }: { label: string, value: string }) { return <div className="line"><span>{label}</span><b>{value}</b></div> }

function Inventory({ s, patch, t }: { s: AppState, patch: any, t: any }) {
  const blank: Vegetable = { id: '', name: '', hindiName: '', category: 'Vegetables', unit: 'kg', barcode: '', purchaseRate: 0, sellingRate: 0, stock: 0, lowStock: s.settings.defaultLowStockKg, wastagePercent: 5, active: true, lastUpdated: now() }
  const [form, setForm] = useState<Vegetable>(blank); const [editId, setEditId] = useState(''); const [q, setQ] = useState('')
  const list = s.vegetables.filter(v => `${v.name} ${v.hindiName} ${v.category} ${v.barcode}`.toLowerCase().includes(q.toLowerCase()))
  const save = () => { if (!form.name) return; patch((old: AppState) => editId ? { ...old, vegetables: old.vegetables.map(v => v.id === editId ? { ...form, id: editId, lastUpdated: now() } : v) } : { ...old, vegetables: [{ ...form, id: id(), lastUpdated: now() }, ...old.vegetables] }); setForm(blank); setEditId('') }
  const deleteVegetable = (veg: Vegetable) => {
    const used = s.sales.some(sale => sale.items.some(item => item.vegetableId === veg.id)) || s.purchases.some(p => p.items.some(item => item.vegetableId === veg.id))
    const msg = used
      ? `${veg.name} is used in old bills/purchases. Delete will remove it from current vegetable list, but old bills will remain. Continue?`
      : `Delete ${veg.name}?`
    if (!confirm(msg)) return
    patch((old: AppState) => ({ ...old, vegetables: old.vegetables.filter(v => v.id !== veg.id) }))
    if (editId === veg.id) { setForm(blank); setEditId('') }
  }
  return <div className="space"><Card className="pad"><h2>{t.inventory}</h2><div className="form-grid"><Input placeholder={t.name} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/><Input placeholder={t.hindiName} value={form.hindiName} onChange={e => setForm({ ...form, hindiName: e.target.value })}/><Input placeholder={t.category} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}/><Select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value as any })}>{units.map(u => <option key={u} value={u}>{t[u]}</option>)}</Select><Input placeholder={t.barcode} value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })}/><Input type="number" placeholder={t.stock} value={form.stock} onChange={e => setForm({ ...form, stock: number(e.target.value) })}/><Input type="number" placeholder={t.purchaseRate} value={form.purchaseRate} onChange={e => setForm({ ...form, purchaseRate: number(e.target.value) })}/><Input type="number" placeholder={t.sellingRate} value={form.sellingRate} onChange={e => setForm({ ...form, sellingRate: number(e.target.value) })}/><Input type="number" placeholder={t.lowStockLevel} value={form.lowStock} onChange={e => setForm({ ...form, lowStock: number(e.target.value) })}/><Input type="number" placeholder={t.wastagePercent} value={form.wastagePercent} onChange={e => setForm({ ...form, wastagePercent: number(e.target.value) })}/><Button onClick={save}>{editId ? t.save : t.add}</Button>{editId && <Button variant="secondary" onClick={() => { setForm(blank); setEditId('') }}>{t.cancel}</Button>}</div></Card><div className="toolbar"><Input placeholder={t.searchVegetable} value={q} onChange={e => setQ(e.target.value)}/><Button variant="secondary" onClick={() => exportCsv(s.vegetables, 'vegetables.csv')}>{t.export}</Button></div><Card><div className="table-wrap"><table><thead><tr><th>{t.name}</th><th>{t.stock}</th><th>{t.purchaseRate}</th><th>{t.sellingRate}</th><th>{t.lowStock}</th><th>Actions</th></tr></thead><tbody>{list.map(v => <tr key={v.id}><td><b>{v.hindiName || v.name}</b><small>{v.name} • {v.category} • {v.barcode}</small></td><td className={v.stock <= v.lowStock ? 'red bold' : 'bold'}>{v.stock} {v.unit}</td><td>{money(v.purchaseRate)}</td><td>{money(v.sellingRate)}</td><td>{v.lowStock} {v.unit}</td><td className="actions"><Button variant="secondary" onClick={() => { setForm(v); setEditId(v.id) }}>{t.edit}</Button><Button variant="danger" onClick={() => deleteVegetable(v)}>{t.delete}</Button></td></tr>)}</tbody></table></div></Card></div>
}

function DailyRates({ s, patch, t }: { s: AppState, patch: any, t: any }) {
  const [rows, setRows] = useState(s.vegetables.map(v => ({ id: v.id, purchaseRate: v.purchaseRate, sellingRate: v.sellingRate, stock: v.stock, lowStock: v.lowStock })))
  useEffect(() => { setRows(s.vegetables.map(v => ({ id: v.id, purchaseRate: v.purchaseRate, sellingRate: v.sellingRate, stock: v.stock, lowStock: v.lowStock }))) }, [s.vegetables])
  const update = (idValue: string, field: string, value: number) => setRows(r => r.map(row => row.id === idValue ? { ...row, [field]: value } : row))
  const saveRates = () => {
    patch((old: AppState) => ({ ...old, vegetables: old.vegetables.map(v => {
      const row = rows.find(r => r.id === v.id)
      return row ? { ...v, purchaseRate: row.purchaseRate, sellingRate: row.sellingRate, stock: row.stock, lowStock: row.lowStock, lastUpdated: now() } : v
    }) }))
    alert('Daily rates and stock saved')
  }
  return <div className="space"><Card className="pad"><h2>{s.settings.language === 'hi' ? 'दैनिक रेट अपडेट' : 'Daily Rate Update'}</h2><p className="muted">Update today's mandi rate, selling rate and opening/current stock quickly.</p><Button onClick={saveRates}>{t.save}</Button></Card><Card><div className="table-wrap"><table><thead><tr><th>{t.name}</th><th>{t.purchaseRate}</th><th>{t.sellingRate}</th><th>{t.stock}</th><th>{t.lowStockLevel}</th></tr></thead><tbody>{s.vegetables.map(v => { const row = rows.find(r => r.id === v.id)!; return <tr key={v.id}><td><b>{v.hindiName || v.name}</b><small>{v.name} • {v.unit}</small></td><td><Input type="number" value={row?.purchaseRate ?? 0} onChange={e => update(v.id, 'purchaseRate', number(e.target.value))}/></td><td><Input type="number" value={row?.sellingRate ?? 0} onChange={e => update(v.id, 'sellingRate', number(e.target.value))}/></td><td><Input type="number" step="0.01" value={row?.stock ?? 0} onChange={e => update(v.id, 'stock', number(e.target.value))}/></td><td><Input type="number" step="0.01" value={row?.lowStock ?? 0} onChange={e => update(v.id, 'lowStock', number(e.target.value))}/></td></tr>})}</tbody></table></div></Card></div>
}

function Purchases({ s, patch, t }: { s: AppState, patch: any, t: any }) {
  const [supplierId, setSupplierId] = useState(s.suppliers[0]?.id || '')
  const [supplierName, setSupplierName] = useState(s.suppliers[0]?.name || '')
  const [vegetableId, setVegetableId] = useState(s.vegetables[0]?.id || '')
  const [qty, setQty] = useState(0)
  const [rate, setRate] = useState(0)
  const [paid, setPaid] = useState(0)
  const chooseSupplier = (value: string) => {
    setSupplierId(value)
    const supplier = s.suppliers.find(x => x.id === value)
    if (supplier) setSupplierName(supplier.name)
  }
  const add = () => {
    const v = s.vegetables.find(x => x.id === vegetableId)
    if (!v || qty <= 0) return
    const existingSupplier = s.suppliers.find(x => x.name.toLowerCase() === supplierName.trim().toLowerCase())
    const finalSupplierId = existingSupplier?.id || supplierId || id()
    const finalSupplierName = supplierName.trim() || 'Mandi'
    const total = qty * rate
    const purchase: Purchase = { id: id(), date: now(), supplierId: finalSupplierId, supplierName: finalSupplierName, items: [{ vegetableId: v.id, name: v.name, qty, rate }], total, paid, due: Math.max(0, total - paid) }
    patch((old: AppState) => ({
      ...old,
      suppliers: existingSupplier || old.suppliers.some(x => x.id === finalSupplierId) ? old.suppliers : [{ id: finalSupplierId, name: finalSupplierName, phone: '', address: '' }, ...old.suppliers],
      purchases: [purchase, ...old.purchases],
      vegetables: old.vegetables.map(x => x.id === v.id ? { ...x, stock: Number((x.stock + qty).toFixed(2)), purchaseRate: rate || x.purchaseRate, lastUpdated: now() } : x),
      stockLogs: [makeStockLog(v.id, v.name, 'PURCHASE', qty, v.stock, purchase.supplierName), ...old.stockLogs]
    }))
    setQty(0); setRate(0); setPaid(0)
  }
  return <div className="space"><Card className="pad"><h2>{t.purchases}</h2><div className="form-grid"><div><Select value={supplierId} onChange={e => chooseSupplier(e.target.value)}><option value="">Choose supplier</option>{s.suppliers.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</Select><Input list="supplier-names" placeholder="Or type supplier name" value={supplierName} onChange={e => { setSupplierName(e.target.value); setSupplierId('') }}/><datalist id="supplier-names">{s.suppliers.map(x => <option key={x.id} value={x.name}/>)}</datalist></div><Select value={vegetableId} onChange={e => setVegetableId(e.target.value)}>{s.vegetables.map(v => <option key={v.id} value={v.id}>{v.hindiName || v.name}</option>)}</Select><Input type="number" placeholder={t.qty} value={qty} onChange={e => setQty(number(e.target.value))}/><Input type="number" placeholder={t.rate} value={rate} onChange={e => setRate(number(e.target.value))}/><Input type="number" placeholder={t.paid} value={paid} onChange={e => setPaid(number(e.target.value))}/><Button onClick={add}>{t.add}</Button></div></Card><Card><Table headers={[t.date, t.supplier, t.name, t.qty, t.total, t.due]} rows={s.purchases.map(p => [new Date(p.date).toLocaleString(), p.supplierName, p.items[0]?.name, p.items[0]?.qty, money(p.total), money(p.due)])}/></Card></div>
}

function Wastage({ s, patch, t }: { s: AppState, patch: any, t: any }) {
  const [vegetableId, setVegetableId] = useState(s.vegetables[0]?.id || ''); const [qty, setQty] = useState(0); const [note, setNote] = useState('Damaged / खराब')
  const add = () => { const v = s.vegetables.find(x => x.id === vegetableId); if (!v || qty <= 0) return; patch((old: AppState) => ({ ...old, vegetables: old.vegetables.map(x => x.id === v.id ? { ...x, stock: Math.max(0, x.stock - qty), lastUpdated: now() } : x), stockLogs: [makeStockLog(v.id, v.name, 'WASTAGE', -qty, v.stock, note), ...old.stockLogs] })); setQty(0) }
  return <div className="space"><Card className="pad"><h2>{t.wastage}</h2><div className="form-grid"><Select value={vegetableId} onChange={e => setVegetableId(e.target.value)}>{s.vegetables.map(v => <option key={v.id} value={v.id}>{v.hindiName || v.name} ({v.stock} {v.unit})</option>)}</Select><Input type="number" placeholder={t.qty} value={qty} onChange={e => setQty(number(e.target.value))}/><Input placeholder={t.note} value={note} onChange={e => setNote(e.target.value)}/><Button onClick={add}>{t.save}</Button></div></Card><Card><Table headers={[t.date, t.name, t.qty, t.note]} rows={s.stockLogs.filter(x => x.type === 'WASTAGE').map(x => [new Date(x.date).toLocaleString(), x.vegetableName, x.qty, x.note])}/></Card></div>
}

function Customers({ s, patch, t }: { s: AppState, patch: any, t: any }) { return <PartyManager title={t.customers} parties={s.customers} t={t} onAdd={(p: any) => patch((old: AppState) => ({ ...old, customers: [{ ...p, id: id(), balance: 0 }, ...old.customers] }))}/> }
function Suppliers({ s, patch, t }: { s: AppState, patch: any, t: any }) { return <PartyManager title={t.suppliers} parties={s.suppliers} t={t} onAdd={(p: any) => patch((old: AppState) => ({ ...old, suppliers: [{ ...p, id: id() }, ...old.suppliers] }))}/> }
function PartyManager({ title, parties, onAdd, t }: any) { const [p, setP] = useState({ name: '', phone: '', address: '' }); return <div className="space"><Card className="pad"><h2>{title}</h2><div className="form-grid"><Input placeholder={t.name} value={p.name} onChange={e => setP({ ...p, name: e.target.value })}/><Input placeholder={t.phone} value={p.phone} onChange={e => setP({ ...p, phone: e.target.value })}/><Input placeholder={t.address} value={p.address} onChange={e => setP({ ...p, address: e.target.value })}/><Button onClick={() => { if (p.name) { onAdd(p); setP({ name: '', phone: '', address: '' }) } }}>{t.add}</Button></div></Card><Card><Table headers={[t.name, t.phone, t.address, t.due]} rows={parties.map((x: any) => [x.name, x.phone, x.address, money(x.balance || 0)])}/></Card></div> }

function Payments({ s, patch, t }: { s: AppState, patch: any, t: any }) {
  const [customerId, setCustomerId] = useState(''); const [amount, setAmount] = useState(0); const [mode, setMode] = useState<PaymentMode>('Cash');
  const add = () => { const c = s.customers.find(x => x.id === customerId); if (!c || amount <= 0) return; const p: Payment = { id: id(), date: now(), partyType: 'customer', partyId: c.id, partyName: c.name, amount, mode, note: 'Due payment' }; patch((old: AppState) => ({ ...old, payments: [p, ...old.payments], customers: old.customers.map(x => x.id === c.id ? { ...x, balance: Math.max(0, x.balance - amount) } : x) })); setAmount(0) }
  return <div className="space"><Card className="pad"><h2>{t.payments}</h2><div className="form-grid"><Select value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">{t.customer}</option>{s.customers.map(c => <option key={c.id} value={c.id}>{c.name} - {money(c.balance)}</option>)}</Select><Input type="number" placeholder={t.amount} value={amount} onChange={e => setAmount(number(e.target.value))}/><Select value={mode} onChange={e => setMode(e.target.value as PaymentMode)}>{paymentModes.filter(x => x !== 'Credit' && x !== 'Mixed').map(x => <option key={x}>{x}</option>)}</Select><Button onClick={add}>{t.save}</Button></div></Card><Card><Table headers={[t.date, t.customer, t.paymentMode, t.amount]} rows={s.payments.map(p => [new Date(p.date).toLocaleString(), p.partyName, p.mode, money(p.amount)])}/></Card></div>
}

function Reports({ s, t }: { s: AppState, t: any }) {
  const revenue = s.sales.reduce((a, x) => a + x.total, 0)
  const purchaseCost = s.sales.reduce((sum, sale) => sum + sale.items.reduce((x, item) => { const v = s.vegetables.find(v => v.id === item.vegetableId); return x + (v?.purchaseRate || 0) * item.qty }, 0), 0)
  const expenses = s.expenses.reduce((a, e) => a + e.amount, 0)
  const customerLedger = [
    ...s.sales.map(x => ({ date: x.date, party: x.customerName, type: 'Bill', ref: x.billNo, debit: x.total, credit: x.paid, due: x.due })),
    ...s.payments.filter(p => p.partyType === 'customer').map(p => ({ date: p.date, party: p.partyName, type: 'Payment', ref: p.note, debit: 0, credit: p.amount, due: 0 }))
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date))
  const supplierLedger = s.purchases.map(x => ({ date: x.date, party: x.supplierName, type: 'Purchase', ref: x.id, debit: x.total, credit: x.paid, due: x.due })).sort((a, b) => +new Date(b.date) - +new Date(a.date))
  return <div className="space"><div className="metrics"><Metric title={t.salesReport} value={money(revenue)}/><Metric title={t.purchaseReport} value={money(s.purchases.reduce((a, x) => a + x.total, 0))}/><Metric title={t.profitReport} value={money(revenue - purchaseCost - expenses)} tone="green"/><Metric title={t.stockLedger} value={String(s.stockLogs.length)} tone="amber"/></div><Card className="pad"><div className="toolbar"><Button variant="secondary" onClick={() => exportCsv(s.sales.map(x => ({ billNo: x.billNo, date: x.date, customer: x.customerName, total: x.total, paid: x.paid, due: x.due })), 'sales.csv')}>{t.salesReport} CSV</Button><Button variant="secondary" onClick={() => exportCsv(s.purchases.map(x => ({ date: x.date, supplier: x.supplierName, total: x.total, paid: x.paid, due: x.due })), 'purchases.csv')}>{t.purchaseReport} CSV</Button><Button variant="secondary" onClick={() => exportCsv(s.stockLogs, 'stock-ledger.csv')}>{t.stockLedger} CSV</Button><Button variant="secondary" onClick={() => exportCsv(customerLedger, 'customer-ledger.csv')}>Customer Ledger CSV</Button><Button variant="secondary" onClick={() => exportCsv(supplierLedger, 'supplier-ledger.csv')}>Supplier Ledger CSV</Button></div></Card><Card><Table headers={['Bill', t.date, t.customer, t.total, t.paid, t.due]} rows={s.sales.map(x => [x.billNo, new Date(x.date).toLocaleString(), x.customerName, money(x.total), money(x.paid), money(x.due)])}/></Card><Card className="pad"><h2>Customer Ledger / ग्राहक लेजर</h2><Table headers={[t.date, t.customer, 'Type', 'Ref', 'Bill', 'Paid', t.due]} rows={customerLedger.map(x => [new Date(x.date).toLocaleString(), x.party, x.type, x.ref, money(x.debit), money(x.credit), money(x.due)])}/></Card><Card className="pad"><h2>Supplier Ledger / सप्लायर लेजर</h2><Table headers={[t.date, t.supplier, 'Type', 'Purchase', 'Paid', t.due]} rows={supplierLedger.map(x => [new Date(x.date).toLocaleString(), x.party, x.type, money(x.debit), money(x.credit), money(x.due)])}/></Card></div>
}

function AppSettings({ s, patch, t }: { s: AppState, patch: any, t: any }) {
  const [settings, setSettings] = useState(s.settings); const [expense, setExpense] = useState({ title: '', amount: 0, note: '' })
  const backup = () => downloadBlob(new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }), `vegetable-shop-backup-${today()}.json`)
  const restore = (file?: File) => { if (!file) return; const r = new FileReader(); r.onload = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(JSON.parse(String(r.result)))); location.reload() } catch { alert('Invalid backup file') } }; r.readAsText(file) }
  const addExpense = () => { if (!expense.title || !expense.amount) return; patch((old: AppState) => ({ ...old, expenses: [{ id: id(), date: now(), ...expense }, ...old.expenses] })); setExpense({ title: '', amount: 0, note: '' }) }
  return <div className="space settings-page"><Card className="pad"><h2>{t.settings}</h2><div className="form-grid"><Input value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} placeholder="Shop Name"/><Input value={settings.owner} onChange={e => setSettings({ ...settings, owner: e.target.value })} placeholder="Owner"/><Input value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} placeholder={t.phone}/><Select value={settings.receiptSize} onChange={e => setSettings({ ...settings, receiptSize: e.target.value as any })}><option value="80mm">80mm</option><option value="58mm">58mm</option></Select><Textarea value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} placeholder={t.address}/><Button onClick={() => patch((old: AppState) => ({ ...old, settings }))}>{t.save}</Button></div></Card><Card className="pad"><h2>{t.expense}</h2><div className="form-grid"><Input placeholder={t.expense} value={expense.title} onChange={e => setExpense({ ...expense, title: e.target.value })}/><Input type="number" placeholder={t.amount} value={expense.amount} onChange={e => setExpense({ ...expense, amount: number(e.target.value) })}/><Input placeholder={t.note} value={expense.note} onChange={e => setExpense({ ...expense, note: e.target.value })}/><Button onClick={addExpense}>{t.add}</Button></div></Card><Card className="pad"><h2>{t.backup}</h2><div className="toolbar"><Button variant="secondary" onClick={backup}>{t.backup}</Button><label className="btn secondary">{t.restore}<input type="file" accept=".json" hidden onChange={e => restore(e.target.files?.[0])}/></label><Button variant="danger" onClick={() => { if (confirm('Reset all data?')) { localStorage.setItem(STORAGE_KEY, JSON.stringify(demoState)); location.reload() } }}>{t.reset}</Button></div></Card></div>
}

function Table({ headers, rows }: { headers: string[], rows: any[][] }) { return <div className="table-wrap"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>) : <tr><td colSpan={headers.length} className="empty">No data</td></tr>}</tbody></table></div> }
