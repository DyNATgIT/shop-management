import { useState } from 'react'

interface Product {
  id: number
  name: string
  stock: number
  price: number
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Basmati Rice (1kg)', stock: 45, price: 85 },
    { id: 2, name: 'Toor Dal (500g)', stock: 30, price: 65 },
    { id: 3, name: 'Sunflower Oil (1L)', stock: 22, price: 135 },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [newProduct, setNewProduct] = useState({ name: '', stock: 0, price: 0 })

  const addProduct = () => {
    if (!newProduct.name) return
    setProducts([...products, { id: Date.now(), name: newProduct.name, stock: newProduct.stock, price: newProduct.price }])
    setNewProduct({ name: '', stock: 0, price: 0 })
  }

  const deleteProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id))
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Inventory</h2>
        <div className="flex gap-3 items-center">
          <input className="border px-4 py-2 rounded-xl text-sm w-72" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <input className="border px-3 py-2 rounded-lg text-sm w-56" placeholder="Product name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
          <input type="number" className="border px-3 py-2 rounded-lg text-sm w-20" placeholder="Stock" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})} />
          <input type="number" className="border px-3 py-2 rounded-lg text-sm w-20" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value) || 0})} />
          <button onClick={addProduct} className="bg-blue-600 text-white px-6 rounded-xl text-sm font-medium hover:bg-blue-700">Add</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Product</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-gray-600">Stock</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Price (₹)</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{p.name}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {p.stock} units
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium">₹{p.price}</td>
                <td className="px-4">
                  <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
