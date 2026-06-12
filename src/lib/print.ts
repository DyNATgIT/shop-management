import { Sale, ShopSettings } from './types'
import { money } from './store'

function saleHtml(sale: Sale, settings: ShopSettings, autoPrint: boolean) {
  const itemRows = sale.items.map(item => `
    <tr>
      <td>${settings.printHindi && item.hindiName ? item.hindiName + '<br><small>' + item.name + '</small>' : item.name}</td>
      <td>${item.qty} ${item.unit}</td>
      <td>${item.rate}</td>
      <td>${money(item.qty * item.rate - item.discount)}</td>
    </tr>`).join('')
  const upiBlock = settings.showUpiOnReceipt && settings.upiId ? `
    <div class="upi-box">
      <div class="qr-placeholder">UPI</div>
      <div><b>Pay by UPI</b><br><small>${settings.upiId}</small><br><small>QR placeholder — real QR will be added later</small></div>
    </div>` : ''
  const footer = settings.receiptFooter || 'Thank you! धन्यवाद!'
  return `<!doctype html><html><head><title>${sale.billNo}</title>
  <style>
    body{font-family:Arial,'Noto Sans Devanagari',sans-serif;margin:0;padding:12px;font-size:12px;color:#111;background:#f4f4f5}.receipt{max-width:${settings.receiptSize};margin:auto;background:#fff;padding:12px}.center{text-align:center}h2{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border-bottom:1px dashed #999;padding:5px 2px;text-align:right;vertical-align:top}th:first-child,td:first-child{text-align:left}.line{display:flex;justify-content:space-between;margin:4px 0}.total{font-size:18px;font-weight:700;border-top:1px solid #111;padding-top:6px;margin-top:6px}.upi-box{display:flex;gap:8px;align-items:center;border:1px dashed #333;padding:8px;margin-top:10px}.qr-placeholder{width:58px;height:58px;border:2px solid #111;display:grid;place-items:center;font-weight:700}.noprint{margin-top:16px;padding:10px 14px}.actions{max-width:${settings.receiptSize};margin:12px auto;display:flex;gap:8px}.actions button{padding:10px 14px}@media print{body{background:#fff;padding:0}.receipt{padding:0}.noprint,.actions{display:none}}
  </style></head><body><div class="receipt"><div class="center"><h2>${settings.name}</h2><div>${settings.address}</div><div>Ph: ${settings.phone}</div><hr><strong>VEGETABLE BILL / सब्जी बिल</strong></div>
  <p>Bill: ${sale.billNo}<br>Date: ${new Date(sale.date).toLocaleString('hi-IN')}<br>Customer: ${sale.customerName}</p>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead><tbody>${itemRows}</tbody></table>
  <div class="line"><span>Subtotal</span><b>${money(sale.subtotal)}</b></div>
  <div class="line"><span>Discount</span><b>${money(sale.discount)}</b></div>
  <div class="line"><span>Round Off</span><b>${money(sale.roundOff)}</b></div>
  <div class="line total"><span>Total</span><span>${money(sale.total)}</span></div>
  <div class="line"><span>Paid</span><b>${money(sale.paid)}</b></div><div class="line"><span>Due</span><b>${money(sale.due)}</b></div>
  ${upiBlock}
  <div class="center"><br>${footer}</div></div><div class="actions"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div>${autoPrint ? '<script>window.print()</script>' : ''}</body></html>`
}

function openReceipt(sale: Sale, settings: ShopSettings, autoPrint: boolean) {
  const w = window.open('', '_blank', 'width=430,height=760')
  if (!w) return
  w.document.write(saleHtml(sale, settings, autoPrint))
  w.document.close()
}

export function printSale(sale: Sale, settings: ShopSettings) {
  openReceipt(sale, settings, true)
}

export function previewSale(sale: Sale, settings: ShopSettings) {
  openReceipt(sale, settings, false)
}
