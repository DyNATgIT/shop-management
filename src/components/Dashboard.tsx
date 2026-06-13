import { AppState, Customer, Vegetable } from '../lib/types'
import { downloadBackup, hasBackupToday, money } from '../lib/store'
import { Button, Card, Metric } from './ui'
import { Table } from './common'
import DatabaseStatus from './DatabaseStatus'

function sameDay(date: string) { return new Date(date).toDateString() === new Date().toDateString() }

export default function Dashboard({ s, patch, t, ownerUnlocked }: any) {
  const todaySales = s.sales.filter((x: any) => !x.cancelledAt && sameDay(x.date))
  const todayPurchases = s.purchases.filter((x: any) => sameDay(x.date))
  const todayExpenses = s.expenses.filter((x: any) => sameDay(x.date))
  const low = s.vegetables.filter((v: Vegetable) => v.active && v.stock <= v.lowStock)
  const stockValue = s.vegetables.reduce((sum: number, v: Vegetable) => sum + v.stock * v.purchaseRate, 0)
  const due = s.customers.reduce((sum: number, c: Customer) => sum + c.balance, 0)
  return <div className="space">
    {!hasBackupToday(s) && <Card className="pad backup-alert"><div><h2>Backup not taken today</h2><p className="muted">Please take a backup before closing the shop.</p></div><Button onClick={() => patch((old: AppState) => downloadBackup(old))}>Backup Now</Button></Card>}
    <DatabaseStatus compact settings={s.settings} />
    <div className="metrics"><Metric title={t.todaySales} value={money(todaySales.reduce((a: number, x: any) => a + x.total, 0))}/><Metric title={t.billsToday} value={String(todaySales.length)} tone="green"/>{ownerUnlocked ? <Metric title={t.stockValue} value={money(stockValue)} tone="amber"/> : <Metric title={t.products} value={String(s.vegetables.length)} tone="amber"/>}{ownerUnlocked ? <Metric title={t.customerDue} value={money(due)} tone="red"/> : <Metric title={t.lowStock} value={String(low.length)} tone="red"/>}</div>
    <div className="grid2"><Card className="pad"><h2>{t.lowStock}</h2>{low.length ? low.map((v: Vegetable) => <div className="list-row" key={v.id}><span>{v.hindiName} / {v.name}</span><b className="red">{v.stock} {v.unit}</b></div>) : <p className="muted">{t.freshStock}</p>}</Card><Card className="pad"><h2>{t.dailySummary}</h2><div className="list-row"><span>{t.todaySales}</span><b>{money(todaySales.reduce((a: number, x: any) => a + x.total, 0))}</b></div>{ownerUnlocked ? <><div className="list-row"><span>{t.purchases}</span><b>{money(todayPurchases.reduce((a: number, x: any) => a + x.total, 0))}</b></div><div className="list-row"><span>{t.expense}</span><b>{money(todayExpenses.reduce((a: number, x: any) => a + x.amount, 0))}</b></div></> : <p className="muted">Purchase and expense totals are owner-only.</p>}</Card></div>
    <Card className="pad"><h2>{t.recentBills}</h2><Table headers={['Bill', t.customer, t.total, t.paymentMode]} rows={s.sales.slice(0, 8).map((x: any) => [x.cancelledAt ? `${x.billNo} (Cancelled)` : x.billNo, x.customerName, ownerUnlocked ? money(x.total) : 'Locked', x.paymentMode])}/></Card>
  </div>
}
