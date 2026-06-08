import { useState } from 'react'

export default function PaymentModes() {
  const [payments, setPayments] = useState<any[]>([])
  const [form, setForm] = useState({ mode: 'Cash', amount: 0, customer: '' })

  const addPayment = () => {
    if (!form.customer || form.amount <= 0) return
    setPayments([...payments, { ...form, date: new Date().toLocaleDateString() }])
    setForm({ mode: 'Cash', amount: 0, customer: '' })
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Payments Received</h2>

      <div className="flex gap-3 mb-6">
        <input className="border px-4 py-2 rounded-xl" placeholder="Customer" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} />
        <input type="number" className="border px-4 py-2 rounded-xl w-32" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: parseInt(e.target.value)||0})} />
        <select className="border px-4 py-2 rounded-xl" value={form.mode} onChange={e => setForm({...form, mode: e.target.value})}>
          <option>Cash</option>
          <option>UPI</option>
          <option>Card</option>
          <option>Credit</option>
        </select>
        <button onClick={addPayment} className="bg-blue-600 text-white px-6 rounded-xl">Record Payment</button>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="px-6 py-4 text-left">Customer</th><th className="px-6 py-4">Mode</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">Date</th></tr></thead>
          <tbody>
            {payments.map((p, i) => (
              <tr key={i} className="border-t">
                <td className="px-6 py-4">{p.customer}</td>
                <td className="px-6 py-4">{p.mode}</td>
                <td className="px-6 py-4 font-medium">₹{p.amount}</td>
                <td className="px-6 py-4">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
