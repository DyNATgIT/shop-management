import { useState } from 'react'
import { AppState, Purchase } from '../lib/types'
import { id, makeStockLog, money, now, number } from '../lib/store'
import { Button, Card, Input, Select } from './ui'
import { Table } from './common'
import { showValidation, validateNonNegative, validatePositive } from '../lib/validation'

export default function Purchases({ s, patch, t }: { s: AppState, patch: any, t: any }) {
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
    if (!v) return alert('Select a vegetable')
    const errors = [validatePositive(qty, 'Purchase quantity'), validateNonNegative(rate, 'Purchase rate'), validateNonNegative(paid, 'Paid amount')].filter(Boolean)
    if (showValidation(errors)) return
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
