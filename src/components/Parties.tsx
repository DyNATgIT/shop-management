import { useState } from 'react'
import { AppState } from '../lib/types'
import { id, money } from '../lib/store'
import { Button, Card, Input } from './ui'
import { Table } from './common'

export function Customers({ s, patch, t }: { s: AppState, patch: any, t: any }) { return <PartyManager title={t.customers} parties={s.customers} t={t} onAdd={(p: any) => patch((old: AppState) => ({ ...old, customers: [{ ...p, id: id(), balance: 0 }, ...old.customers] }))}/> }
export function Suppliers({ s, patch, t }: { s: AppState, patch: any, t: any }) { return <PartyManager title={t.suppliers} parties={s.suppliers} t={t} onAdd={(p: any) => patch((old: AppState) => ({ ...old, suppliers: [{ ...p, id: id() }, ...old.suppliers] }))}/> }
function PartyManager({ title, parties, onAdd, t }: any) { const [p, setP] = useState({ name: '', phone: '', address: '' }); return <div className="space"><Card className="pad"><h2>{title}</h2><div className="form-grid"><Input placeholder={t.name} value={p.name} onChange={e => setP({ ...p, name: e.target.value })}/><Input placeholder={t.phone} value={p.phone} onChange={e => setP({ ...p, phone: e.target.value })}/><Input placeholder={t.address} value={p.address} onChange={e => setP({ ...p, address: e.target.value })}/><Button onClick={() => { if (p.name) { onAdd(p); setP({ name: '', phone: '', address: '' }) } }}>{t.add}</Button></div></Card><Card><Table headers={[t.name, t.phone, t.address, t.due]} rows={parties.map((x: any) => [x.name, x.phone, x.address, money(x.balance || 0)])}/></Card></div> }
