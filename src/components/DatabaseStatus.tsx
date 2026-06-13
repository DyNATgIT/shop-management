import { useEffect, useState } from 'react'
import { Card } from './ui'

export default function DatabaseStatus({ compact = false, settings }: { compact?: boolean, settings?: any }) {
  const [dbInfo, setDbInfo] = useState<any>(null)
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const isDesktop = Boolean(window.desktopApp?.isDesktop)
  useEffect(() => {
    const refresh = () => window.desktopApp?.getDatabaseInfo?.().then(setDbInfo).catch(() => setDbInfo(null))
    refresh()
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    const timer = window.setInterval(refresh, 15000)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); window.clearInterval(timer) }
  }, [])

  const storageMode = isDesktop ? 'Desktop SQLite' : 'Browser Local'
  const dbActive = isDesktop ? Boolean(dbInfo?.hasState || dbInfo?.dbPath) : false
  const backupStatus = isDesktop ? (dbInfo?.hasBackupToday ? 'Done today' : 'Not done today') : 'JSON backup only'
  const cloudConfigured = Boolean(settings?.supabaseUrl && settings?.supabaseAnonKey && settings?.cloudShopId && settings?.cloudSyncEnabled)
  const cloudStatus = cloudConfigured ? 'Configured' : 'Not configured'

  if (compact) {
    return <Card className="pad status-card"><div className="status-strip"><span className="status-pill good">{storageMode}</span><span className={`status-pill ${dbActive || !isDesktop ? 'good' : 'warn'}`}>{isDesktop ? (dbActive ? 'SQLite Active' : 'SQLite Loading') : 'Local Browser Storage'}</span><span className={`status-pill ${dbInfo?.hasBackupToday ? 'good' : 'warn'}`}>Backup: {backupStatus}</span><span className="status-pill neutral">Cloud Sync: {cloudStatus}</span></div></Card>
  }

  return <Card className="pad status-card"><div className="section-head"><div><h2>Database & Sync Status</h2><p className="muted">Local storage, SQLite backup and future cloud sync status.</p></div></div><div className="status-grid"><div><span>Storage Mode</span><b>{storageMode}</b></div><div><span>App Online</span><b>{online ? 'Online' : 'Offline'}</b></div><div><span>SQLite Status</span><b>{isDesktop ? (dbActive ? 'Active' : 'Starting') : 'Not used in browser'}</b></div><div><span>Today Backup</span><b>{backupStatus}</b></div><div><span>Cloud Sync</span><b>{cloudStatus}</b></div><div><span>Last Cloud Sync</span><b>{settings?.lastCloudSyncAt ? new Date(settings.lastCloudSyncAt).toLocaleString() : 'Never'}</b></div><div><span>Last Sync Status</span><b>{settings?.lastCloudSyncStatus || 'None'}</b></div></div>{dbInfo && <div className="db-paths"><div className="list-row"><span>Database</span><b>{dbInfo.dbPath}</b></div><div className="list-row"><span>Backup Folder</span><b>{dbInfo.backupDir}</b></div><div className="list-row"><span>Schema Version</span><b>{dbInfo.schemaVersion || '1'}</b></div><div className="list-row"><span>Normalized Last Updated</span><b>{dbInfo.normalizedAt ? new Date(dbInfo.normalizedAt).toLocaleString() : 'Not yet'}</b></div><div className="list-row"><span>Last Backup</span><b>{dbInfo.lastBackup ? dbInfo.lastBackup.name : 'Never'}</b></div>{dbInfo.normalizedCounts && <><h3 className="mini-title">Normalized SQLite Tables</h3><div className="count-grid">{Object.entries(dbInfo.normalizedCounts).map(([key, value]) => <div key={key}><span>{key}</span><b>{String(value)}</b></div>)}</div></>}</div>}</Card>
}
