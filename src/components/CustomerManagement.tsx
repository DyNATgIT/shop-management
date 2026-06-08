import { useState } from 'react'

interface Customer {
  id: number
  name: string
  phone: string
  balance: number
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 1, name: 'Ramesh Kumar', phone: '9876543210', balance: 2500 },
    { id: 2, name: 'Sita Devi', phone: '9123456780', balance: 0 },
  ])

  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' })

  const addCustomer = () => {
    if (!newCustomer.name) return
    setCustomers([...customers, {
      id: Date.now(),
      name: newCustomer.name,
      phone: newCustomer.phone,
      balance: 0
    }])
    setNewCustomer({ name: '', phone: '' })
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Customers</h2>
      
      <div className="flex gap-3 mb-6">
        <input className="border px-4 py-2 rounded-xl" placeholder="Customer Name" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
        <input className="border px-4 py-2 rounded-xl" placeholder="Phone Number" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
        <button onClick={addCustomer} className="bg-blue-600 text-white px-6 rounded-xl">Add Customer</button>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="text-left px-6 py-4">Name</th><th className="text-left px-6 py-4">Phone</th><th className="text-right px-6 py-4">Due Amount</th></tr></thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-t">
                <td className="px-6 py-4 font-medium">{c.name}</td>
                <td className="px-6 py-4">{c.phone}</td>
                <td className="px-6 py-4 text-right font-medium text-red-600">₹{c.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
