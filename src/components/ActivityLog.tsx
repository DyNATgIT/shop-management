import { AppState } from '../lib/types'
import { exportCsv } from '../lib/store'
import { Button, Card } from './ui'
import { Table } from './common'

export default function ActivityLog({ s }: { s: AppState }) {
  const logs = s.auditLogs || []
  return <Card className="pad"><div className="section-head"><div><h2>Activity Log</h2><p className="muted">Recent important actions for audit and troubleshooting.</p></div><Button variant="secondary" onClick={() => exportCsv(logs, 'activity-log.csv')}>Export Activity CSV</Button></div><Table headers={['Date', 'Type', 'Message']} rows={logs.slice(0, 100).map(log => [new Date(log.date).toLocaleString(), log.type, log.message])}/></Card>
}
