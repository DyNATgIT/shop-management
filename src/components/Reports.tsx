export default function Reports() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Reports</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border">
          <h3 className="font-semibold mb-4">Daily Sales Report</h3>
          <div className="text-3xl font-semibold">₹18,750</div>
          <div className="text-sm text-gray-500 mt-1">Today • 42 bills</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border">
          <h3 className="font-semibold mb-4">Monthly Sales</h3>
          <div className="text-3xl font-semibold">₹4,85,200</div>
          <div className="text-sm text-gray-500 mt-1">This Month</div>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-2xl border">
        <h3 className="font-semibold mb-4">Top Selling Products</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Basmati Rice (1kg)</span><span>142 units</span></div>
          <div className="flex justify-between"><span>Sunflower Oil (1L)</span><span>98 units</span></div>
          <div className="flex justify-between"><span>Toor Dal (500g)</span><span>76 units</span></div>
        </div>
      </div>
    </div>
  )
}
