import { useState } from 'react'
import { AppState } from '../lib/types'
import { makeStockLog, now, number } from '../lib/store'
import { Button, Card, Input, Select } from './ui'
import { Table } from './common'

export default function Wastage({ s, patch, t }: { s: AppState, patch: any, t: any }) {
  const [vegetableId, setVegetableId] = useState(s.vegetables[0]?.id || ''); const [qty, setQty] = useState(0); const [note, setNote] = useState('Damaged / खराब')
  const add = () => { const v = s.vegetables.find(x => x.id === vegetableId); if (!v || qty <= 0) return; patch((old: AppState) => ({ ...old, vegetables: old.vegetables.map(x => x.id === v.id ? { ...x, stock: Math.max(0, x.stock - qty), lastUpdated: now() } : x), stockLogs: [makeStockLog(v.id, v.name, 'WASTAGE', -qty, v.stock, note), ...old.stockLogs] })); setQty(0) }
  return <div className="space"><Card className="pad"><h2>{t.wastage}</h2><div className="form-grid"><Select value={vegetableId} onChange={e => setVegetableId(e.target.value)}>{s.vegetables.map(v => <option key={v.id} value={v.id}>{v.hindiName || v.name} ({v.stock} {v.unit})</option>)}</Select><Input type="number" placeholder={t.qty} value={qty} onChange={e => setQty(number(e.target.value))}/><Input placeholder={t.note} value={note} onChange={e => setNote(e.target.value)}/><Button onClick={add}>{t.save}</Button></div></Card><Card><Table headers={[t.date, t.name, t.qty, t.note]} rows={s.stockLogs.filter(x => x.type === 'WASTAGE').map(x => [new Date(x.date).toLocaleString(), x.vegetableName, x.qty, x.note])}/></Card></div>
}
