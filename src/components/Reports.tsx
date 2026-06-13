import { useState } from 'react'
import { AppState } from '../lib/types'
import { downloadBackup, exportCsv, hasBackupToday, id, makeStockLog, money, now, number, today } from '../lib/store'
import { Button, Card, Input, Metric } from './ui'
import { Line, Table } from './common'

export default function Reports({ s, patch, t }: { s: AppState, patch: any, t: any }) {
  const [closingDate, setClosingDate] = useState(today())
  const isSelectedDay = (date: string) => new Date(date).toISOString().slice(0, 10) === closingDate

  const activeSales = s.sales.filter(x => !x.cancelledAt)
  const allReturns = s.returns || []
  const allReturnsTotal = allReturns.reduce((a, x) => a + x.amount, 0)
  const revenue = activeSales.reduce((a, x) => a + x.total, 0) - allReturnsTotal
  const allReturnedCost = allReturns.reduce((sum, r) => { const v = s.vegetables.find(v => v.id === r.vegetableId); return sum + (v?.purchaseRate || 0) * r.qty }, 0)
  const purchaseCost = activeSales.reduce((sum, sale) => sum + sale.items.reduce((x, item) => { const v = s.vegetables.find(v => v.id === item.vegetableId); return x + (v?.purchaseRate || 0) * item.qty }, 0), 0) - allReturnedCost
  const expenses = s.expenses.reduce((a, e) => a + e.amount, 0)
  const cancelSale = (saleId: string) => {
    const sale = s.sales.find(x => x.id === saleId)
    if (!sale || sale.cancelledAt) return
    const reason = prompt(`Reason for cancelling ${sale.billNo}?`, 'Customer return / wrong bill') || 'Cancelled'
    if (!confirm(`Cancel ${sale.billNo}? Stock will be restored and customer due adjusted.`)) return
    patch((old: AppState) => {
      const currentSale = old.sales.find(x => x.id === saleId)
      if (!currentSale || currentSale.cancelledAt) return old
      const cancelledAt = now()
      return {
        ...old,
        sales: old.sales.map(x => x.id === saleId ? { ...x, cancelledAt, cancelReason: reason } : x),
        vegetables: old.vegetables.map(v => {
          const item = currentSale.items.find(i => i.vegetableId === v.id)
          return item ? { ...v, stock: Number((v.stock + item.qty).toFixed(2)), lastUpdated: cancelledAt } : v
        }),
        customers: currentSale.customerId ? old.customers.map(c => c.id === currentSale.customerId ? { ...c, balance: Math.max(0, c.balance - currentSale.due) } : c) : old.customers,
        stockLogs: [
          ...currentSale.items.map(item => {
            const veg = old.vegetables.find(v => v.id === item.vegetableId)
            const before = veg?.stock || 0
            return makeStockLog(item.vegetableId, item.name, 'RETURN', item.qty, before, `Cancel ${currentSale.billNo}: ${reason}`)
          }),
          ...old.stockLogs
        ]
      }
    })
  }

  const returnItem = (saleId: string) => {
    const sale = s.sales.find(x => x.id === saleId)
    if (!sale || sale.cancelledAt) return
    if (!sale.items.length) return alert('No items in this bill')
    const list = sale.items.map((item, index) => `${index + 1}. ${item.hindiName || item.name} / ${item.name} - ${item.qty} ${item.unit} @ ${item.rate}`).join('\n')
    const selected = number(prompt(`Select item to return from ${sale.billNo}:\n${list}`, '1') || '0')
    const item = sale.items[selected - 1]
    if (!item) return alert('Invalid item')
    const qty = number(prompt(`Return quantity for ${item.name} (max ${item.qty} ${item.unit})`, String(item.qty)) || '0')
    if (qty <= 0 || qty > item.qty) return alert('Invalid return quantity')
    const reason = prompt('Reason for return?', 'Customer return') || 'Customer return'
    const discountShare = item.discount ? item.discount * (qty / item.qty) : 0
    const amount = Math.max(0, qty * item.rate - discountShare)
    if (!confirm(`Return ${qty} ${item.unit} ${item.name}?\nAmount adjustment: ${money(amount)}\nStock will be restored.`)) return
    patch((old: AppState) => {
      const currentSale = old.sales.find(x => x.id === saleId)
      if (!currentSale || currentSale.cancelledAt) return old
      const currentItem = currentSale.items[selected - 1]
      const returnedAt = now()
      const returnRecord = { id: id(), date: returnedAt, saleId: currentSale.id, billNo: currentSale.billNo, vegetableId: currentItem.vegetableId, vegetableName: currentItem.name, qty, unit: currentItem.unit, rate: currentItem.rate, amount, reason }
      return {
        ...old,
        returns: [returnRecord, ...(old.returns || [])],
        vegetables: old.vegetables.map(v => v.id === currentItem.vegetableId ? { ...v, stock: Number((v.stock + qty).toFixed(2)), lastUpdated: returnedAt } : v),
        customers: currentSale.customerId ? old.customers.map(c => c.id === currentSale.customerId ? { ...c, balance: Math.max(0, c.balance - amount) } : c) : old.customers,
        stockLogs: [makeStockLog(currentItem.vegetableId, currentItem.name, 'RETURN', qty, old.vegetables.find(v => v.id === currentItem.vegetableId)?.stock || 0, `Partial return ${currentSale.billNo}: ${reason}`), ...old.stockLogs]
      }
    })
  }

  const returns = s.returns || []
  const dayReturns = returns.filter(x => isSelectedDay(x.date))
  const returnsTotal = returns.reduce((a, x) => a + x.amount, 0)
  const dayReturnsTotal = dayReturns.reduce((a, x) => a + x.amount, 0)
  const returnedCost = returns.reduce((sum, r) => {
    const v = s.vegetables.find(v => v.id === r.vegetableId)
    return sum + (v?.purchaseRate || 0) * r.qty
  }, 0)
  const dayReturnedCost = dayReturns.reduce((sum, r) => {
    const v = s.vegetables.find(v => v.id === r.vegetableId)
    return sum + (v?.purchaseRate || 0) * r.qty
  }, 0)

  const daySales = activeSales.filter(x => isSelectedDay(x.date))
  const dayPurchases = s.purchases.filter(x => isSelectedDay(x.date))
  const dayExpenses = s.expenses.filter(x => isSelectedDay(x.date))
  const dayWastage = s.stockLogs.filter(x => x.type === 'WASTAGE' && isSelectedDay(x.date))
  const dayPayments = s.payments.filter(x => isSelectedDay(x.date))

  const salesTotal = daySales.reduce((a, x) => a + x.total, 0) - dayReturnsTotal
  const salesPaid = daySales.reduce((a, x) => a + x.paid, 0)
  const salesDue = daySales.reduce((a, x) => a + x.due, 0)
  const cashSales = daySales.filter(x => x.paymentMode === 'Cash').reduce((a, x) => a + x.paid, 0)
  const upiSales = daySales.filter(x => x.paymentMode === 'UPI').reduce((a, x) => a + x.paid, 0)
  const cardSales = daySales.filter(x => x.paymentMode === 'Card').reduce((a, x) => a + x.paid, 0)
  const creditSales = daySales.filter(x => x.paymentMode === 'Credit').reduce((a, x) => a + x.total, 0)
  const mixedSales = daySales.filter(x => x.paymentMode === 'Mixed').reduce((a, x) => a + x.paid, 0)
  const extraCustomerPayments = dayPayments.filter(x => x.partyType === 'customer' && !daySales.some(sale => sale.billNo === x.note)).reduce((a, x) => a + x.amount, 0)

  const purchaseTotal = dayPurchases.reduce((a, x) => a + x.total, 0)
  const purchasePaid = dayPurchases.reduce((a, x) => a + x.paid, 0)
  const purchaseDue = dayPurchases.reduce((a, x) => a + x.due, 0)
  const expenseTotal = dayExpenses.reduce((a, x) => a + x.amount, 0)
  const soldCost = daySales.reduce((sum, sale) => sum + sale.items.reduce((x, item) => { const v = s.vegetables.find(v => v.id === item.vegetableId); return x + (v?.purchaseRate || 0) * item.qty }, 0), 0) - dayReturnedCost
  const wastageLoss = dayWastage.reduce((sum, log) => { const v = s.vegetables.find(v => v.id === log.vegetableId); return sum + Math.abs(log.qty) * (v?.purchaseRate || 0) }, 0)
  const grossProfit = salesTotal - soldCost
  const netProfit = grossProfit - expenseTotal - wastageLoss
  const lowStock = s.vegetables.filter(v => v.stock <= v.lowStock)

  const customerLedger = [
    ...s.sales.map(x => ({ date: x.date, party: x.customerName, type: x.cancelledAt ? 'Cancelled Bill' : 'Bill', ref: x.billNo, debit: x.cancelledAt ? 0 : x.total, credit: x.cancelledAt ? 0 : x.paid, due: x.cancelledAt ? 0 : x.due })),
    ...s.payments.filter(p => p.partyType === 'customer').map(p => ({ date: p.date, party: p.partyName, type: 'Payment', ref: p.note, debit: 0, credit: p.amount, due: 0 }))
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date))
  const supplierLedger = s.purchases.map(x => ({ date: x.date, party: x.supplierName, type: 'Purchase', ref: x.id, debit: x.total, credit: x.paid, due: x.due })).sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const closingRows = [
    { section: 'Sales', item: 'Net Sales', value: salesTotal },
    { section: 'Sales', item: 'Returns', value: dayReturnsTotal },
    { section: 'Sales', item: 'Bills', value: daySales.length },
    { section: 'Collection', item: 'Cash Collected', value: cashSales },
    { section: 'Collection', item: 'UPI Collected', value: upiSales },
    { section: 'Collection', item: 'Card Collected', value: cardSales },
    { section: 'Collection', item: 'Credit Given', value: creditSales },
    { section: 'Collection', item: 'Extra Customer Payments', value: extraCustomerPayments },
    { section: 'Purchase', item: 'Mandi Purchase', value: purchaseTotal },
    { section: 'Purchase', item: 'Purchase Paid', value: purchasePaid },
    { section: 'Purchase', item: 'Purchase Due', value: purchaseDue },
    { section: 'Expense', item: 'Expenses', value: expenseTotal },
    { section: 'Wastage', item: 'Wastage Loss', value: wastageLoss },
    { section: 'Profit', item: 'Gross Profit', value: grossProfit },
    { section: 'Profit', item: 'Net Profit', value: netProfit }
  ]

  const printClosing = () => {
    const w = window.open('', '_blank', 'width=760,height=900')
    if (!w) return
    const rows = closingRows.map(r => `<tr><td>${r.section}</td><td>${r.item}</td><td>${typeof r.value === 'number' && r.item !== 'Bills' ? money(r.value) : r.value}</td></tr>`).join('')
    const saleRows = daySales.map(x => `<tr><td>${x.billNo}</td><td>${x.customerName}</td><td>${x.paymentMode}</td><td>${money(x.total)}</td><td>${money(x.due)}</td></tr>`).join('')
    const wastageRows = dayWastage.map(x => `<tr><td>${x.vegetableName}</td><td>${Math.abs(x.qty)}</td><td>${x.note}</td></tr>`).join('')
    const returnRows = dayReturns.map(x => `<tr><td>${x.billNo}</td><td>${x.vegetableName}</td><td>${x.qty} ${x.unit}</td><td>${money(x.amount)}</td><td>${x.reason}</td></tr>`).join('')
    w.document.write(`<!doctype html><html><head><title>Closing Report ${closingDate}</title><style>body{font-family:Arial,'Noto Sans Devanagari',sans-serif;padding:24px;color:#111}h1,h2{margin:0 0 10px}.muted{color:#666;margin-bottom:18px}table{width:100%;border-collapse:collapse;margin:14px 0 24px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f4f6}.right{text-align:right}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.card{border:1px solid #ddd;padding:12px;border-radius:10px}.big{font-size:22px;font-weight:700}@media print{button{display:none}}</style></head><body><h1>${s.settings.name}</h1><div class="muted">Daily Closing Report • ${closingDate} • ${s.settings.phone}</div><div class="grid"><div class="card"><div>Total Sales</div><div class="big">${money(salesTotal)}</div></div><div class="card"><div>Net Profit Estimate</div><div class="big">${money(netProfit)}</div></div></div><h2>Summary</h2><table><thead><tr><th>Section</th><th>Item</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table><h2>Bills</h2><table><thead><tr><th>Bill</th><th>Customer</th><th>Mode</th><th>Total</th><th>Due</th></tr></thead><tbody>${saleRows || '<tr><td colspan="5">No bills</td></tr>'}</tbody></table><h2>Returns</h2><table><thead><tr><th>Bill</th><th>Vegetable</th><th>Qty</th><th>Amount</th><th>Reason</th></tr></thead><tbody>${returnRows || '<tr><td colspan="5">No returns</td></tr>'}</tbody></table><h2>Wastage</h2><table><thead><tr><th>Vegetable</th><th>Qty</th><th>Note</th></tr></thead><tbody>${wastageRows || '<tr><td colspan="3">No wastage</td></tr>'}</tbody></table><button onclick="print()">Print</button><script>print()</script></body></html>`)
    w.document.close()
  }

  return <div className="space">
    {!hasBackupToday(s) && <Card className="pad backup-alert"><div><h2>Backup reminder</h2><p className="muted">After checking daily closing, take today's backup.</p></div><Button onClick={() => patch((old: AppState) => downloadBackup(old))}>Backup Now</Button></Card>}
    <Card className="pad closing-card"><div className="section-head"><div><h2>Daily Closing Report / दैनिक क्लोजिंग रिपोर्ट</h2><p className="muted">End-of-day sales, collection, purchase, wastage and profit summary.</p></div><div className="toolbar"><Input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)}/><Button variant="secondary" onClick={printClosing}>Print Closing</Button><Button variant="secondary" onClick={() => exportCsv(closingRows, `closing-report-${closingDate}.csv`)}>Export Closing CSV</Button></div></div></Card>
    <div className="metrics"><Metric title="Total Sales" value={money(salesTotal)}/><Metric title="Collected" value={money(salesPaid + extraCustomerPayments)} tone="green"/><Metric title="Pending Due" value={money(salesDue)} tone="red"/><Metric title="Net Profit Est." value={money(netProfit)} tone="amber"/></div>
    <div className="grid2"><Card className="pad"><h2>Sales & Collection</h2><Line label="Bills" value={String(daySales.length)}/><Line label="Net Sales" value={money(salesTotal)}/><Line label="Returns" value={money(dayReturnsTotal)}/><Line label="Cash" value={money(cashSales)}/><Line label="UPI" value={money(upiSales)}/><Line label="Card" value={money(cardSales)}/><Line label="Mixed" value={money(mixedSales)}/><Line label="Credit Given" value={money(creditSales)}/><Line label="Extra Customer Payments" value={money(extraCustomerPayments)}/></Card><Card className="pad"><h2>Purchase, Expense & Profit</h2><Line label="Mandi Purchase" value={money(purchaseTotal)}/><Line label="Purchase Paid" value={money(purchasePaid)}/><Line label="Purchase Due" value={money(purchaseDue)}/><Line label="Expenses" value={money(expenseTotal)}/><Line label="Wastage Loss" value={money(wastageLoss)}/><Line label="Sold Item Cost" value={money(soldCost)}/><Line label="Gross Profit" value={money(grossProfit)}/><div className="grand"><span>Net Profit</span><b>{money(netProfit)}</b></div></Card></div>
    <div className="grid2"><Card className="pad"><h2>Today's Bills</h2><Table headers={['Bill', t.customer, t.paymentMode, t.total, t.due]} rows={daySales.map(x => [x.billNo, x.customerName, x.paymentMode, money(x.total), money(x.due)])}/></Card><Card className="pad"><h2>Wastage Today</h2><Table headers={[t.name, t.qty, t.note]} rows={dayWastage.map(x => [x.vegetableName, Math.abs(x.qty), x.note])}/></Card></div><Card className="pad"><h2>Returns Today / आज की वापसी</h2><Table headers={['Bill', t.name, t.qty, t.amount, t.note]} rows={dayReturns.map(x => [x.billNo, x.vegetableName, `${x.qty} ${x.unit}`, money(x.amount), x.reason])}/></Card>
    <Card className="pad"><h2>Low Stock at Closing</h2><Table headers={[t.name, t.stock, t.lowStockLevel]} rows={lowStock.map(v => [v.hindiName || v.name, `${v.stock} ${v.unit}`, `${v.lowStock} ${v.unit}`])}/></Card>

    <div className="metrics"><Metric title={t.salesReport} value={money(revenue)}/><Metric title={t.purchaseReport} value={money(s.purchases.reduce((a, x) => a + x.total, 0))}/><Metric title={t.profitReport} value={money(revenue - purchaseCost - expenses)} tone="green"/><Metric title={t.stockLedger} value={String(s.stockLogs.length)} tone="amber"/></div><Card className="pad"><div className="toolbar"><Button variant="secondary" onClick={() => exportCsv(s.sales.map(x => ({ billNo: x.billNo, date: x.date, customer: x.customerName, total: x.total, paid: x.paid, due: x.due })), 'sales.csv')}>{t.salesReport} CSV</Button><Button variant="secondary" onClick={() => exportCsv(s.purchases.map(x => ({ date: x.date, supplier: x.supplierName, total: x.total, paid: x.paid, due: x.due })), 'purchases.csv')}>{t.purchaseReport} CSV</Button><Button variant="secondary" onClick={() => exportCsv(s.stockLogs, 'stock-ledger.csv')}>{t.stockLedger} CSV</Button><Button variant="secondary" onClick={() => exportCsv(customerLedger, 'customer-ledger.csv')}>Customer Ledger CSV</Button><Button variant="secondary" onClick={() => exportCsv(supplierLedger, 'supplier-ledger.csv')}>Supplier Ledger CSV</Button></div></Card><Card><Table headers={['Bill', t.date, t.customer, t.total, t.paid, t.due, 'Status', 'Action']} rows={s.sales.map(x => [x.billNo, new Date(x.date).toLocaleString(), x.customerName, money(x.total), money(x.paid), money(x.due), x.cancelledAt ? `Cancelled: ${x.cancelReason || ''}` : 'Active', x.cancelledAt ? '-' : <div className="actions"><Button variant="secondary" onClick={() => returnItem(x.id)}>Return Item</Button><Button variant="danger" onClick={() => cancelSale(x.id)}>Cancel</Button></div>])}/></Card><Card className="pad"><h2>Return Report / वापसी रिपोर्ट</h2><Table headers={[t.date, 'Bill', t.name, t.qty, t.amount, t.note]} rows={returns.map(x => [new Date(x.date).toLocaleString(), x.billNo, x.vegetableName, `${x.qty} ${x.unit}`, money(x.amount), x.reason])}/></Card><Card className="pad"><h2>Customer Ledger / ग्राहक लेजर</h2><Table headers={[t.date, t.customer, 'Type', 'Ref', 'Bill', 'Paid', t.due]} rows={customerLedger.map(x => [new Date(x.date).toLocaleString(), x.party, x.type, x.ref, money(x.debit), money(x.credit), money(x.due)])}/></Card><Card className="pad"><h2>Supplier Ledger / सप्लायर लेजर</h2><Table headers={[t.date, t.supplier, 'Type', 'Purchase', 'Paid', t.due]} rows={supplierLedger.map(x => [new Date(x.date).toLocaleString(), x.party, x.type, money(x.debit), money(x.credit), money(x.due)])}/></Card></div>
}
