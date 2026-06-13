import { useEffect, useState } from 'react'
import { AppState } from '../lib/types'
import { now, number } from '../lib/store'
import { Button, Card, Input } from './ui'

export default function DailyRates({ s, patch, t }: { s: AppState, patch: any, t: any }) {
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
