import { useState } from 'react'

export default function Settings() {
  const [shop, setShop] = useState({
    name: 'Your Shop Name',
    address: 'Main Market, City',
    phone: '9876543210',
    gstin: '',
    state: 'Delhi'
  })

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold mb-6">Shop Settings</h2>

      <div className="bg-white p-6 rounded-2xl border space-y-4">
        <div>
          <label className="text-sm text-gray-600">Shop Name</label>
          <input className="border w-full px-4 py-3 rounded-xl mt-1" value={shop.name} onChange={e => setShop({...shop, name: e.target.value})} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Address</label>
          <input className="border w-full px-4 py-3 rounded-xl mt-1" value={shop.address} onChange={e => setShop({...shop, address: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Phone</label>
            <input className="border w-full px-4 py-3 rounded-xl mt-1" value={shop.phone} onChange={e => setShop({...shop, phone: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-gray-600">GSTIN</label>
            <input className="border w-full px-4 py-3 rounded-xl mt-1" value={shop.gstin} onChange={e => setShop({...shop, gstin: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600">State</label>
          <input className="border w-full px-4 py-3 rounded-xl mt-1" value={shop.state} onChange={e => setShop({...shop, state: e.target.value})} />
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        These details will appear on your invoices.
      </div>
    </div>
  )
}
