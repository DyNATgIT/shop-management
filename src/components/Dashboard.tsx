import { Package, Receipt, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl"><TrendingUp className="text-blue-600" /></div>
            <div>
              <div className="text-sm text-gray-500">Today's Sales</div>
              <div className="text-3xl font-semibold">₹12,450</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl"><Package className="text-green-600" /></div>
            <div>
              <div className="text-sm text-gray-500">Total Products</div>
              <div className="text-3xl font-semibold">248</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl"><Receipt className="text-orange-600" /></div>
            <div>
              <div className="text-sm text-gray-500">Bills Today</div>
              <div className="text-3xl font-semibold">37</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-2xl border">
        <h3 className="font-semibold mb-4">Low Stock Alerts</h3>
        <div className="text-sm text-gray-600">• Sunflower Oil (1L) — Only 8 left</div>
        <div className="text-sm text-gray-600">• Toor Dal (500g) — Only 12 left</div>
      </div>
    </div>
  )
}
