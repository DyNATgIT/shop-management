import { useState } from 'react'

export default function StockAdjustment() {
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [form, setForm] = useState({ product: '', qty: 0, reason: 'Damaged' })

  const addAdjustment = () => {
    if (!form.product) return
    setAdjustments([...adjustments, { ...form, date: new Date().toLocaleDateString() }])
    setForm({ product: '', qty: 0, reason: 'Damaged' })
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Stock Adjustment</h2>

      <div className="flex gap-3 mb-6">
        <input className="border px-4 py-2 rounded-xl" placeholder="Product Name" value={form.product} onChange={e => setForm({...form, product: e.target.value})} />
        <input type="number" className="border px-4 py-2 rounded-xl w-24" placeholder="Qty" value={form.qty} onChange={e => setForm({...form, qty: parseInt(e.target.value)||0})} />
        <select className="border px-4 py-2 rounded-xl" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}>
          <option>Damaged</option>
          <option>Expired</option>
          <option>Returned</option>
          <option>Other</option>
        </select>
        <button onClick={addAdjustment} className="bg-blue-600 text-white px-6 rounded-xl">Adjust Stock</button>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="px-6 py-4">Product</th><th className="px-6 py-4">Qty</th><th className="px-6 py-4">Reason</th><th className="px-6 py-4">Date</th></tr></thead>
          <tbody>
            {adjustments.map((a, i) => (
              <tr key={i} className="border-t">
                <td className="px-6 py-4">{a.product}</td>
                <td className="px-6 py-4 text-red-600">-{a.qty}</td>
                <td className="px-6 py-4">{a.reason}</td>
                <td className="px-6 py-4">{a.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
