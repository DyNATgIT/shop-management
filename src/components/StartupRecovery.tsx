import { useState } from 'react'
import { demoState, downloadBlob, saveState, STORAGE_KEY, today } from '../lib/store'
import { RecoveryIssue, repairState } from '../lib/recovery'
import { Button, Card } from './ui'

export default function StartupRecovery({ issue, onRecovered }: { issue: RecoveryIssue, onRecovered: () => void }) {
  const [message, setMessage] = useState('')

  const exportBroken = () => {
    downloadBlob(new Blob([issue.raw || ''], { type: 'application/json' }), `broken-data-${today()}.json`)
    setMessage('Broken data exported. You can now restore or reset safely.')
  }

  const restoreBackup = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const repaired = repairState(parsed)
        saveState(repaired)
        await window.desktopApp?.setAppState?.(repaired).catch(() => undefined)
        onRecovered()
      } catch (error) {
        setMessage(`Restore failed: ${error instanceof Error ? error.message : 'Invalid backup'}`)
      }
    }
    reader.readAsText(file)
  }

  const resetDemo = async () => {
    if (!confirm('Reset app to demo data? Export broken data first if needed.')) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoState))
    await window.desktopApp?.setAppState?.(demoState).catch(() => undefined)
    onRecovered()
  }

  const continueDemo = () => {
    sessionStorage.setItem('vsm-ignore-startup-recovery', '1')
    onRecovered()
  }

  return <div className="crash-page"><Card className="pad crash-card"><div className="crash-icon">🛟</div><h1>Startup Recovery</h1><p>The app found a problem while loading saved data.</p><div className="crash-error">{issue.message}</div><div className="crash-actions"><Button onClick={exportBroken}>Export Broken Data</Button><label className="btn secondary">Restore Backup<input type="file" accept=".json" hidden onChange={e => restoreBackup(e.target.files?.[0])}/></label><Button variant="danger" onClick={resetDemo}>Reset to Demo</Button><Button variant="secondary" onClick={continueDemo}>Continue This Session</Button></div>{message && <p className="muted">{message}</p>}</Card></div>
}
