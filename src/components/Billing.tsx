import { useState } from 'react'
import jsPDF from 'jspdf'

export default function Billing() {
  const [items, setItems] = useState<any[]>([])
  const [customerName, setCustomerName] = useState('')
  const [gstin, setGstin] = useState('')

  const addItem = () => setItems([...items, { name: '', qty: 1, price: 0, gstRate: 18 }])
  const updateItem = (i: number, field: string, val: any) => { const arr = [...items]; arr[i][field] = val; setItems(arr) }
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  const calcGST = () => {
    let taxable = 0, cgst = 0, sgst = 0
    items.forEach(it => {
      const amt = it.qty * it.price
      taxable += amt
      const gst = amt * ((it.gstRate || 18) / 100)
      cgst += gst / 2; sgst += gst / 2
    })
    return { taxable: taxable.toFixed(2), cgst: cgst.toFixed(2), sgst: sgst.toFixed(2), total: (taxable + cgst + sgst).toFixed(2) }
  }
  const gst = calcGST()

  const generateBill = () => {
    const doc = new jsPDF()
    doc.setFontSize(20); doc.text("TAX INVOICE", 105, 15, { align: "center" })
    doc.setFontSize(14); doc.text("Your Shop Name", 105, 23, { align: "center" })
    doc.setFontSize(10); doc.text("GSTIN: " + (gstin || "Your GST Number"), 105, 29, { align: "center" })
    doc.setFontSize(11)
    doc.text(`Date: ${new Date().toLocaleDateString('hi-IN')}`, 20, 40)
    doc.text(`Customer: ${customerName || 'Cash Customer'}`, 20, 47)

    let y = 58
    doc.text("Item", 20, y); doc.text("Qty", 80, y); doc.text("Rate", 105, y); doc.text("GST%", 130, y); doc.text("Amount", 160, y); y += 6
    items.forEach(it => {
      doc.text(it.name.substring(0,25), 20, y); doc.text(String(it.qty), 80, y); doc.text(String(it.price), 105, y); doc.text(String(it.gstRate||18), 130, y); doc.text((it.qty*it.price).toFixed(2), 160, y); y += 6
    })
    y += 8
    doc.text(`Taxable: ₹${gst.taxable}`, 160, y); y += 6
    doc.text(`CGST: ₹${gst.cgst}`, 160, y); y += 6
    doc.text(`SGST: ₹${gst.sgst}`, 160, y); y += 8
    doc.setFontSize(13); doc.text(`Grand Total: ₹${gst.total}`, 160, y)
    doc.save('GST_Invoice.pdf')
  }

  const printThermal = () => {
    const receipt = `YOUR SHOP NAME\nDate: ${new Date().toLocaleDateString()}\nCustomer: ${customerName}\n\n${items.map(it => `${it.name} ${it.qty}x${it.price}`).join('\n')}\nTotal: ₹${gst.total}`
    const w = window.open('', '', 'width=400,height=600')
    if (w) { w.document.write(`<pre>${receipt}</pre>`); w.document.close(); w.print() }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold mb-6">Create GST Invoice</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <input className="border px-4 py-3 rounded-2xl" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
        <input className="border px-4 py-3 rounded-2xl" placeholder="Your GSTIN" value={gstin} onChange={e => setGstin(e.target.value)} />
      </div>
      <button onClick={addItem} className="mb-4 text-blue-600">+ Add Item</button>
      {items.map((item, index) => (
        <div key={index} className="flex gap-3 mb-3">
          <input className="border flex-1 px-4 py-3 rounded-2xl" placeholder="Item" value={item.name} onChange={e => updateItem(index, 'name', e.target.value)} />
          <input type="number" className="border w-20 px-4 py-3 rounded-2xl" placeholder="Qty" value={item.qty} onChange={e => updateItem(index, 'qty', parseInt(e.target.value)||1)} />
          <input type="number" className="border w-24 px-4 py-3 rounded-2xl" placeholder="Price" value={item.price} onChange={e => updateItem(index, 'price', parseInt(e.target.value)||0)} />
          <select className="border px-3 py-3 rounded-2xl" value={item.gstRate} onChange={e => updateItem(index, 'gstRate', parseInt(e.target.value))}>
            <option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
          </select>
          <button onClick={() => removeItem(index)} className="text-red-500 px-3">✕</button>
        </div>
      ))}
      {items.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-2xl mt-6 text-sm">
          <div className="flex justify-between"><span>Taxable Amount</span><span>₹{gst.taxable}</span></div>
          <div className="flex justify-between"><span>CGST</span><span>₹{gst.cgst}</span></div>
          <div className="flex justify-between"><span>SGST</span><span>₹{gst.sgst}</span></div>
          <div className="flex justify-between font-semibold text-lg mt-2 border-t pt-2"><span>Grand Total</span><span>₹{gst.total}</span></div>
        </div>
      )}
      <div className="mt-6 flex gap-3">
        <button onClick={generateBill} disabled={!items.length} className="bg-blue-600 text-white px-8 py-3 rounded-2xl disabled:bg-gray-300">Download GST Invoice</button>
        <button onClick={printThermal} disabled={!items.length} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl disabled:bg-gray-300">Print Thermal</button>
      </div>
    </div>
  )
}
