import { useState } from 'react'
import { AppState, Unit, Vegetable } from '../lib/types'
import { exportCsv, id, money, now, number, units } from '../lib/store'
import { Button, Card, Input, Select } from './ui'
import { showValidation, validateVegetableInput } from '../lib/validation'

function parseCsv(text: string) {
  const rows: string[][] = []
  let current = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]
    if (char === '"' && inQuotes && next === '"') { current += '"'; i++; continue }
    if (char === '"') { inQuotes = !inQuotes; continue }
    if (char === ',' && !inQuotes) { row.push(current.trim()); current = ''; continue }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++
      row.push(current.trim())
      if (row.some(cell => cell.length)) rows.push(row)
      row = []; current = ''
      continue
    }
    current += char
  }
  row.push(current.trim())
  if (row.some(cell => cell.length)) rows.push(row)
  return rows
}

export default function Inventory({ s, patch, t }: { s: AppState, patch: any, t: any }) {
  const blank: Vegetable = { id: '', name: '', hindiName: '', category: 'Vegetables', unit: 'kg', barcode: '', purchaseRate: 0, sellingRate: 0, stock: 0, lowStock: s.settings.defaultLowStockKg, wastagePercent: 5, active: true, lastUpdated: now() }
  const [form, setForm] = useState<Vegetable>(blank)
  const [editId, setEditId] = useState('')
  const [q, setQ] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const list = s.vegetables.filter(v => `${v.name} ${v.hindiName} ${v.category} ${v.barcode}`.toLowerCase().includes(q.toLowerCase()))

  const save = () => {
    if (showValidation(validateVegetableInput(form))) return
    patch((old: AppState) => editId ? { ...old, vegetables: old.vegetables.map(v => v.id === editId ? { ...form, id: editId, lastUpdated: now() } : v) } : { ...old, vegetables: [{ ...form, id: id(), lastUpdated: now() }, ...old.vegetables] })
    setForm(blank)
    setEditId('')
  }

  const deleteVegetable = (veg: Vegetable) => {
    const used = s.sales.some(sale => sale.items.some(item => item.vegetableId === veg.id)) || s.purchases.some(p => p.items.some(item => item.vegetableId === veg.id))
    const msg = used
      ? `${veg.name} is used in old bills/purchases. Delete will remove it from current vegetable list, but old bills will remain. Continue?`
      : `Delete ${veg.name}?`
    if (!confirm(msg)) return
    patch((old: AppState) => ({ ...old, vegetables: old.vegetables.filter(v => v.id !== veg.id) }))
    if (editId === veg.id) { setForm(blank); setEditId('') }
  }

  const downloadTemplate = () => {
    exportCsv([
      { name: 'Tomato', hindiName: 'टमाटर', category: 'Vegetables', unit: 'kg', barcode: 'TOM', purchaseRate: 25, sellingRate: 40, stock: 30, lowStock: 5, wastagePercent: 5 },
      { name: 'Coriander', hindiName: 'धनिया', category: 'Leafy', unit: 'bunch', barcode: 'COR', purchaseRate: 5, sellingRate: 10, stock: 40, lowStock: 10, wastagePercent: 15 }
    ], 'vegetables-import-template.csv')
  }

  const importVegetables = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result || ''))
        if (rows.length < 2) throw new Error('CSV must have header and at least one row')
        const headers = rows[0].map(h => h.trim())
        const get = (row: string[], key: string) => row[headers.indexOf(key)] || ''
        const imported: Vegetable[] = []
        for (const row of rows.slice(1)) {
          const name = get(row, 'name')
          if (!name) continue
          const unit = (get(row, 'unit') || 'kg') as Unit
          const importedVegetable = {
            id: id(),
            name,
            hindiName: get(row, 'hindiName'),
            category: get(row, 'category') || 'Vegetables',
            unit: units.includes(unit) ? unit : 'kg',
            barcode: get(row, 'barcode'),
            purchaseRate: number(get(row, 'purchaseRate')),
            sellingRate: number(get(row, 'sellingRate')),
            stock: number(get(row, 'stock')),
            lowStock: number(get(row, 'lowStock')) || s.settings.defaultLowStockKg,
            wastagePercent: number(get(row, 'wastagePercent')),
            active: true,
            lastUpdated: now()
          }
          const errors = validateVegetableInput(importedVegetable)
          if (errors.length) throw new Error(`${name}: ${errors.join(' ')}`)
          imported.push(importedVegetable)
        }
        if (!imported.length) throw new Error('No valid vegetables found')
        patch((old: AppState) => {
          const existingByName = new Map(old.vegetables.map(v => [v.name.toLowerCase(), v]))
          const merged = [...old.vegetables]
          let added = 0, updated = 0
          for (const item of imported) {
            const existing = existingByName.get(item.name.toLowerCase())
            if (existing) {
              const index = merged.findIndex(v => v.id === existing.id)
              merged[index] = { ...existing, ...item, id: existing.id, lastUpdated: now() }
              updated++
            } else {
              merged.unshift(item)
              added++
            }
          }
          setImportMessage(`Import complete: ${added} added, ${updated} updated.`)
          return { ...old, vegetables: merged }
        })
      } catch (error) {
        setImportMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    reader.readAsText(file)
  }

  return <div className="space"><Card className="pad"><h2>{t.inventory}</h2><div className="form-grid"><Input placeholder={t.name} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/><Input placeholder={t.hindiName} value={form.hindiName} onChange={e => setForm({ ...form, hindiName: e.target.value })}/><Input placeholder={t.category} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}/><Select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value as any })}>{units.map(u => <option key={u} value={u}>{t[u]}</option>)}</Select><Input placeholder={t.barcode} value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })}/><Input type="number" placeholder={t.stock} value={form.stock} onChange={e => setForm({ ...form, stock: number(e.target.value) })}/><Input type="number" placeholder={t.purchaseRate} value={form.purchaseRate} onChange={e => setForm({ ...form, purchaseRate: number(e.target.value) })}/><Input type="number" placeholder={t.sellingRate} value={form.sellingRate} onChange={e => setForm({ ...form, sellingRate: number(e.target.value) })}/><Input type="number" placeholder={t.lowStockLevel} value={form.lowStock} onChange={e => setForm({ ...form, lowStock: number(e.target.value) })}/><Input type="number" placeholder={t.wastagePercent} value={form.wastagePercent} onChange={e => setForm({ ...form, wastagePercent: number(e.target.value) })}/><Button onClick={save}>{editId ? t.save : t.add}</Button>{editId && <Button variant="secondary" onClick={() => { setForm(blank); setEditId('') }}>{t.cancel}</Button>}</div></Card><Card className="pad"><h2>Import / Export Vegetables</h2><p className="muted">CSV columns: name, hindiName, category, unit, barcode, purchaseRate, sellingRate, stock, lowStock, wastagePercent</p><div className="toolbar"><Button variant="secondary" onClick={downloadTemplate}>Download Import Template</Button><label className="btn secondary">Import CSV<input type="file" accept=".csv,text/csv" hidden onChange={e => importVegetables(e.target.files?.[0])}/></label><Button variant="secondary" onClick={() => exportCsv(s.vegetables, 'vegetables.csv')}>{t.export}</Button></div>{importMessage && <p className="muted">{importMessage}</p>}</Card><div className="toolbar"><Input placeholder={t.searchVegetable} value={q} onChange={e => setQ(e.target.value)}/></div><Card><div className="table-wrap"><table><thead><tr><th>{t.name}</th><th>{t.stock}</th><th>{t.purchaseRate}</th><th>{t.sellingRate}</th><th>{t.lowStock}</th><th>Actions</th></tr></thead><tbody>{list.map(v => <tr key={v.id}><td><b>{v.hindiName || v.name}</b><small>{v.name} • {v.category} • {v.barcode}</small></td><td className={v.stock <= v.lowStock ? 'red bold' : 'bold'}>{v.stock} {v.unit}</td><td>{money(v.purchaseRate)}</td><td>{money(v.sellingRate)}</td><td>{v.lowStock} {v.unit}</td><td className="actions"><Button variant="secondary" onClick={() => { setForm(v); setEditId(v.id) }}>{t.edit}</Button><Button variant="danger" onClick={() => deleteVegetable(v)}>{t.delete}</Button></td></tr>)}</tbody></table></div></Card></div>
}
