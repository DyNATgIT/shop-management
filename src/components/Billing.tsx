import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { AppState, CartItem, PaymentMode, Vegetable } from '../lib/types'
import { calcCart, id, makeStockLog, money, now, number, paymentModes } from '../lib/store'
import { previewSale, printSale } from '../lib/print'
import { Button, Card, Input, Select } from './ui'
import { Line } from './common'
import { showValidation, validateCartItems, validatePositive } from '../lib/validation'

export default function Billing({ s, patch, t }: { s: AppState, patch: (fn: (s: AppState) => AppState) => void, t: any }) {
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
    const errors = [validatePositive(qty, `${v.name} quantity`)].filter(Boolean)
    if (discount < 0) errors.push('Discount cannot be negative.')
    if (discount > qty * v.sellingRate) errors.push('Discount cannot be greater than item amount.')
    if (showValidation(errors)) return
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
    if (showValidation(validateCartItems(cart))) return
    if (paid < 0 || !Number.isFinite(paid)) return alert('Paid amount cannot be negative or invalid.')
    const finalPaid = mode === 'Credit' ? 0 : (paid || totals.total)
    const sale = { id: id(), billNo: `BILL-${String(s.billCounter).padStart(5, '0')}`, date: now(), customerId, customerName: customerName || t.cashCustomer, customerPhone, items: cart, ...totals, paid: finalPaid, due: Math.max(0, totals.total - finalPaid), paymentMode: mode }
    patch(old => ({ ...old, billCounter: old.billCounter + 1, sales: [sale, ...old.sales], vegetables: old.vegetables.map(v => { const item = cart.find(i => i.vegetableId === v.id); return item ? { ...v, stock: Number((v.stock - item.qty).toFixed(2)), lastUpdated: now() } : v }), customers: old.customers.map(c => c.id === customerId ? { ...c, balance: c.balance + sale.due } : c), payments: finalPaid > 0 ? [{ id: id(), date: sale.date, partyType: 'customer', partyId: customerId, partyName: sale.customerName, amount: finalPaid, mode, note: sale.billNo }, ...old.payments] : old.payments, stockLogs: [...cart.map(i => { const v = old.vegetables.find(x => x.id === i.vegetableId)!; return makeStockLog(i.vegetableId, i.name, 'SALE', -i.qty, v.stock, sale.billNo) }), ...old.stockLogs] }))
    if (shouldPrint) printSale(sale, s.settings)
    setCart([]); setCustomerId(''); setCustomerName(''); setCustomerPhone(''); setPaid(0); setMode('Cash')
    setTimeout(() => searchRef.current?.focus(), 0)
  }
  const preview = () => {
    if (showValidation(validateCartItems(cart))) return
    if (paid < 0 || !Number.isFinite(paid)) return alert('Paid amount cannot be negative or invalid.')
    const finalPaid = mode === 'Credit' ? 0 : (paid || totals.total)
    previewSale({ id: 'preview', billNo: `PREVIEW-${String(s.billCounter).padStart(5, '0')}`, date: now(), customerId, customerName: customerName || t.cashCustomer, customerPhone, items: cart, ...totals, paid: finalPaid, due: Math.max(0, totals.total - finalPaid), paymentMode: mode }, s.settings)
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
  </div><div className="space"><Card className="pad"><h2>{t.billing}</h2><Select value={customerId} onChange={e => chooseCustomer(e.target.value)}><option value="">{t.cashCustomer}</option>{s.customers.map(c => <option key={c.id} value={c.id}>{c.name} - {money(c.balance)}</option>)}</Select><Input placeholder={t.customer} value={customerName} onChange={e => setCustomerName(e.target.value)}/><Input placeholder={t.phone} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}/><Select value={mode} onChange={e => setMode(e.target.value as PaymentMode)}>{paymentModes.map(m => <option key={m}>{m}</option>)}</Select><Input type="number" placeholder={t.paid} value={paid} onChange={e => setPaid(number(e.target.value))}/></Card><Card className="pad sticky-total"><Line label="Subtotal" value={money(totals.subtotal)}/><Line label={t.discount} value={money(totals.discount)}/><Line label="Round Off" value={money(totals.roundOff)}/><div className="grand"><span>{t.total}</span><b>{money(totals.total)}</b></div><Line label={t.due} value={money(Math.max(0, totals.total - (mode === 'Credit' ? 0 : (paid || totals.total))))}/><Button className="full" onClick={() => save(false)}>{t.save}</Button><Button className="full" variant="secondary" onClick={preview}>Receipt Preview</Button><Button className="full" variant="secondary" onClick={() => save(true)}>{t.savePrint}</Button></Card></div>

  {selectedVeg && <div className="modal-backdrop" onClick={() => setSelectedVeg(null)}><div className="qty-modal" onClick={e => e.stopPropagation()}><div className="modal-title"><div><h2>{selectedVeg.hindiName || selectedVeg.name}</h2><p>{selectedVeg.name} • {money(selectedVeg.sellingRate)}/{selectedVeg.unit} • Stock {selectedVeg.stock} {selectedVeg.unit}</p></div><button onClick={() => setSelectedVeg(null)}>×</button></div><label>{t.qty}</label><Input autoFocus type="number" step="0.01" value={selectedQty} onChange={e => setSelectedQty(number(e.target.value))}/><div className="qty-chips">{quickQty.map(q => <button key={q} onClick={() => setSelectedQty(q)}>{q} {selectedVeg.unit}</button>)}</div><label>{t.discount}</label><Input type="number" value={selectedDiscount} onChange={e => setSelectedDiscount(number(e.target.value))}/><div className="preview-total"><span>{t.amount}</span><b>{money(selectedQty * selectedVeg.sellingRate - selectedDiscount)}</b></div><div className="modal-actions"><Button variant="secondary" onClick={() => setSelectedVeg(null)}>{t.cancel}</Button><Button onClick={() => addItem(selectedVeg, selectedQty, selectedDiscount)}>{t.add}</Button></div></div></div>}
  </div>
}
