import React from 'react'
import { demoState, downloadBlob, STORAGE_KEY, today } from '../lib/store'
import { APP_VERSION } from '../lib/version'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; message: string; stack?: string }

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unknown error', stack: error.stack }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info)
  }

  exportEmergencyBackup = async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const data = raw || JSON.stringify(demoState, null, 2)
      downloadBlob(new Blob([data], { type: 'application/json' }), `emergency-backup-${today()}.json`)
      try {
        const parsed = JSON.parse(data)
        await window.desktopApp?.setAppState?.(parsed)
        await window.desktopApp?.backupDatabase?.()
      } catch {
        // JSON backup is still enough if SQLite backup fails.
      }
    } catch (error) {
      alert(`Emergency backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  resetLocalData = async () => {
    if (!confirm('Reset local app data to demo data? Use Export Emergency Backup first if unsure.')) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoState))
    await window.desktopApp?.setAppState?.(demoState).catch(() => undefined)
    location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return <div className="crash-page">
      <div className="crash-card">
        <div className="crash-icon">⚠️</div>
        <h1>Something went wrong</h1>
        <p>The app hit an unexpected error. Your data may still be recoverable.</p>
        <div className="crash-meta"><b>Version:</b> {APP_VERSION}</div>
        <div className="crash-error">{this.state.message}</div>
        <div className="crash-actions">
          <button onClick={() => location.reload()}>Reload App</button>
          <button onClick={this.exportEmergencyBackup}>Export Emergency Backup</button>
          <button onClick={this.resetLocalData} className="danger">Reset Local Data</button>
        </div>
        {this.state.stack && <details><summary>Technical details</summary><pre>{this.state.stack}</pre></details>}
      </div>
    </div>
  }
}
