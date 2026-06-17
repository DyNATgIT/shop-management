import QRCode from 'qrcode'
import { Sale, ShopSettings } from './types'
import { money } from './store'

function formatQty(qty: number, unit: string) {
  const clean = Number(qty).toLocaleString('en-IN', { maximumFractionDigits: 2 })
  const shortUnit: Record<string, string> = { piece: 'pc', bunch: 'bun', dozen: 'doz', crate: 'crt' }
  return `${clean}${shortUnit[unit] || unit}`
}

function buildUpiUrl(sale: Sale, settings: ShopSettings) {
  const params = new URLSearchParams({
    pa: settings.upiId,
    pn: settings.name || 'Vegetable Shop',
    am: String(Math.max(0, sale.due || sale.total).toFixed(2)),
    cu: 'INR',
    tn: sale.billNo
  })
  return `upi://pay?${params.toString()}`
}

async function buildUpiBlock(sale: Sale, settings: ShopSettings, is58: boolean) {
  if (!settings.showUpiOnReceipt || !settings.upiId) return ''
  try {
    const qrDataUrl = await QRCode.toDataURL(buildUpiUrl(sale, settings), {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: is58 ? 92 : 116,
      color: { dark: '#000000', light: '#ffffff' }
    })
    return `
    <div class="upi-box real-qr">
      <img class="qr-img" src="${qrDataUrl}" alt="UPI QR" />
      <div class="upi-text">
        <b>Pay by UPI</b>
        <span>${settings.upiId}</span>
        <small>Scan to pay ${money(Math.max(0, sale.due || sale.total))}</small>
      </div>
    </div>`
  } catch (error) {
    console.error('QR generation failed', error)
    return `
    <div class="upi-box">
      <div class="qr-placeholder"><span>UPI</span><small>QR</small></div>
      <div class="upi-text">
        <b>Pay by UPI</b>
        <span>${settings.upiId}</span>
        <small>QR failed to generate</small>
      </div>
    </div>`
  }
}

async function saleHtml(sale: Sale, settings: ShopSettings, autoPrint: boolean) {
  const is58 = settings.receiptSize === '58mm'
  const pageHeight = is58 ? '200mm' : '297mm'
  const itemRows = sale.items.map((item, index) => {
    const amount = (item.stockQty ?? item.qty) * item.rate - item.discount
    const primaryName = settings.printHindi && item.hindiName ? item.hindiName : item.name
    const secondaryName = settings.printHindi && item.hindiName ? item.name : item.hindiName
    if (is58) {
      return `
        <div class="item compact">
          <div class="item-name"><b>${index + 1}. ${primaryName}</b>${secondaryName ? `<small>${secondaryName}</small>` : ''}</div>
          <div class="item-calc"><span>${formatQty(item.qty, item.unit)} × ${item.rate}/${item.stockUnit || item.unit}</span><b>${money(amount)}</b></div>
          ${item.discount ? `<div class="item-discount">Discount: ${money(item.discount)}</div>` : ''}
        </div>`
    }
    return `
      <tr>
        <td class="name"><b>${primaryName}</b>${secondaryName ? `<small>${secondaryName}</small>` : ''}</td>
        <td>${formatQty(item.qty, item.unit)}</td>
        <td>${item.rate}/${item.stockUnit || item.unit}</td>
        <td>${money(amount)}</td>
      </tr>`
  }).join('')

  const upiBlock = await buildUpiBlock(sale, settings, is58)
  const footer = settings.receiptFooter || 'Thank you! धन्यवाद!'
  const itemsMarkup = is58
    ? `<div class="items-compact">${itemRows}</div>`
    : `<table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead><tbody>${itemRows}</tbody></table>`

  return `<!doctype html><html><head><title>${sale.billNo}</title>
  <style>
    :root{--paper-width:${settings.receiptSize};--ink:#111;--muted:#555;--line:#222;--soft:#eee}
    *{box-sizing:border-box}
    body{font-family:Arial,'Noto Sans Devanagari',sans-serif;margin:0;padding:14px;font-size:${is58 ? '11px' : '12px'};color:var(--ink);background:#f4f4f5}
    .receipt{width:var(--paper-width);max-width:100%;margin:auto;background:#fff;padding:${is58 ? '8px' : '12px'};box-shadow:0 10px 40px rgba(0,0,0,.12)}
    .center{text-align:center}.shop-name{font-size:${is58 ? '16px' : '18px'};font-weight:800;line-height:1.1;margin:0;text-transform:uppercase}.shop-meta{font-size:${is58 ? '10px' : '11px'};line-height:1.35;margin-top:4px}.bill-title{font-weight:800;letter-spacing:.08em;border-top:1px dashed var(--line);border-bottom:1px dashed var(--line);padding:6px 0;margin:8px 0}.meta{font-size:${is58 ? '10px' : '11px'};line-height:1.45;margin:7px 0}.meta .row,.line{display:flex;justify-content:space-between;gap:8px}.divider{border-top:1px dashed var(--line);margin:8px 0}
    table{width:100%;border-collapse:collapse;margin-top:6px}th,td{border-bottom:1px dashed #999;padding:5px 2px;text-align:right;vertical-align:top}th{font-size:10px;text-transform:uppercase}th:first-child,td:first-child{text-align:left}.name b{display:block;font-size:${is58 ? '11px' : '12px'}}small{display:block;color:var(--muted);font-size:${is58 ? '9px' : '10px'};line-height:1.25}.items-compact{border-top:1px dashed var(--line);border-bottom:1px dashed var(--line);margin:8px 0}.item.compact{padding:6px 0;border-bottom:1px dashed #bbb}.item.compact:last-child{border-bottom:0}.item-name b{display:block;font-size:12px}.item-calc{display:flex;justify-content:space-between;gap:8px;margin-top:3px}.item-discount{font-size:10px;color:var(--muted);text-align:right}.totals{margin-top:8px}.line{margin:4px 0}.grand-total{border-top:2px solid var(--line);border-bottom:2px solid var(--line);padding:7px 0;margin:7px 0;font-size:${is58 ? '16px' : '18px'};font-weight:900}.payment{margin-top:6px}.upi-box{display:flex;gap:8px;align-items:center;justify-content:center;border:1px dashed #333;padding:8px;margin-top:10px}.upi-box.real-qr{align-items:center}.qr-img{width:${is58 ? '82px' : '96px'};height:${is58 ? '82px' : '96px'};image-rendering:pixelated}.qr-placeholder{width:${is58 ? '48px' : '58px'};height:${is58 ? '48px' : '58px'};border:2px solid #111;display:grid;place-items:center;font-weight:900;line-height:1}.qr-placeholder small{font-size:8px;color:#111}.upi-text{font-size:10px;line-height:1.3}.upi-text b,.upi-text span{display:block}.footer{border-top:1px dashed var(--line);margin-top:10px;padding-top:8px;font-weight:700;line-height:1.35}.actions{width:var(--paper-width);max-width:100%;margin:12px auto;display:flex;gap:8px}.actions button{padding:10px 14px;border:0;border-radius:8px;background:#111;color:#fff;font-weight:700}.actions button:last-child{background:#e5e7eb;color:#111}
    @media print{body{background:#fff;padding:0}.receipt{box-shadow:none;padding:${is58 ? '2mm' : '3mm'}}.actions{display:none}@page{size:${settings.receiptSize} ${pageHeight};margin:0}}
  </style></head><body><div class="receipt">
    <div class="center">
      <h1 class="shop-name">${settings.name}</h1>
      <div class="shop-meta">${settings.address}<br>Ph: ${settings.phone}</div>
      <div class="bill-title">VEGETABLE BILL / सब्जी बिल</div>
    </div>
    <div class="meta">
      <div class="row"><span>Bill No</span><b>${sale.billNo}</b></div>
      <div class="row"><span>Date</span><b>${new Date(sale.date).toLocaleString('hi-IN')}</b></div>
      <div class="row"><span>Customer</span><b>${sale.customerName}</b></div>
    </div>
    ${itemsMarkup}
    <div class="totals">
      <div class="line"><span>Subtotal</span><b>${money(sale.subtotal)}</b></div>
      <div class="line"><span>Discount</span><b>${money(sale.discount)}</b></div>
      <div class="line"><span>Round Off</span><b>${money(sale.roundOff)}</b></div>
      <div class="line grand-total"><span>TOTAL</span><span>${money(sale.total)}</span></div>
    </div>
    <div class="payment">
      <div class="line"><span>Paid</span><b>${money(sale.paid)}</b></div>
      <div class="line"><span>Due</span><b>${money(sale.due)}</b></div>
      <div class="line"><span>Mode</span><b>${sale.paymentMode}</b></div>
    </div>
    ${upiBlock}
    <div class="center footer">${footer}</div>
  </div><div class="actions"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div>${autoPrint ? '<script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},700);});</script>' : ''}</body></html>`
}

async function openReceipt(sale: Sale, settings: ShopSettings, autoPrint: boolean) {
  const w = window.open('', '_blank', 'width=430,height=760')
  if (!w) return
  w.document.write(await saleHtml(sale, settings, autoPrint))
  w.document.close()
}

export async function printSale(sale: Sale, settings: ShopSettings) {
  const html = await saleHtml(sale, settings, false)
  if (window.desktopApp?.printReceiptHtml) {
    window.desktopApp.printReceiptHtml(html).then(result => {
      if (!result?.ok) {
        console.error('Desktop print failed:', result?.error)
        openReceipt(sale, settings, false)
      }
    }).catch(error => {
      console.error('Desktop print failed:', error)
      openReceipt(sale, settings, false)
    })
    return
  }
  openReceipt(sale, settings, true)
}

export function previewSale(sale: Sale, settings: ShopSettings) {
  openReceipt(sale, settings, false)
}
