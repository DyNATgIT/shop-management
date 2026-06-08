import { useState } from 'react'

export default function PurchaseEntry() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [form, setForm] = useState({ product: '', qty: 0, price: 0, supplier: '' })

  const addPurchase = () => {
    if (!form.product) return
    setPurchases([...purchases, { ...form, date: new Date().toLocaleDateString() }])
    setForm({ product: '', qty: 0, price: 0, supplier: '' })
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Purchase Entry</h2>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <input className="border px-4 py-2 rounded-xl" placeholder="Product Name" value={form.product} onChange={e => setForm({...form, product: e.target.value})} />
        <input type="number" className="border px-4 py-2 rounded-xl" placeholder="Quantity" value={form.qty} onChange={e => setForm({...form, qty: parseInt(e.target.value)||0})} />
        <input type="number" className="border px-4 py-2 rounded-xl" placeholder="Purchase Price" value={form.price} onChange={e => setForm({...form, price: parseInt(e.target.value)||0})} />
        <input className="border px-4 py-2 rounded-xl" placeholder="Supplier" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} />
      </div>
      <button onClick={addPurchase} className="bg-blue-600 text-white px-6 py-2 rounded-xl mb-6">Add Purchase</button>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="px-6 py-4 text-left">Product</th><th className="px-6 py-4">Qty</th><th className="px-6 py-4">Price</th><th className="px-6 py-4">Supplier</th><th className="px-6 py-4">Date</th></tr></thead>
          <tbody>
            {purchases.map((p, i) => (
              <tr key={i} className="border-t">
                <td className="px-6 py-4">{p.product}</td>
                <td className="px-6 py-4">{p.qty}</td>
                <td className="px-6 py-4">₹{p.price}</td>
                <td className="px-6 py-4">{p.supplier}</td>
                <td className="px-6 py-4">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
