import { useState } from 'react'
import { AppState, Payment, PaymentMode } from '../lib/types'
import { id, money, now, number, paymentModes } from '../lib/store'
import { Button, Card, Input, Select } from './ui'
import { Table } from './common'

export default function Payments({ s, patch, t }: { s: AppState, patch: any, t: any }) {
  const [customerId, setCustomerId] = useState(''); const [amount, setAmount] = useState(0); const [mode, setMode] = useState<PaymentMode>('Cash');
  const add = () => { const c = s.customers.find(x => x.id === customerId); if (!c || amount <= 0) return; const p: Payment = { id: id(), date: now(), partyType: 'customer', partyId: c.id, partyName: c.name, amount, mode, note: 'Due payment' }; patch((old: AppState) => ({ ...old, payments: [p, ...old.payments], customers: old.customers.map(x => x.id === c.id ? { ...x, balance: Math.max(0, x.balance - amount) } : x) })); setAmount(0) }
  return <div className="space"><Card className="pad"><h2>{t.payments}</h2><div className="form-grid"><Select value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">{t.customer}</option>{s.customers.map(c => <option key={c.id} value={c.id}>{c.name} - {money(c.balance)}</option>)}</Select><Input type="number" placeholder={t.amount} value={amount} onChange={e => setAmount(number(e.target.value))}/><Select value={mode} onChange={e => setMode(e.target.value as PaymentMode)}>{paymentModes.filter(x => x !== 'Credit' && x !== 'Mixed').map(x => <option key={x}>{x}</option>)}</Select><Button onClick={add}>{t.save}</Button></div></Card><Card><Table headers={[t.date, t.customer, t.paymentMode, t.amount]} rows={s.payments.map(p => [new Date(p.date).toLocaleString(), p.partyName, p.mode, money(p.amount)])}/></Card></div>
}
