import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import StartupRecovery from './components/StartupRecovery'
import { checkStartupRecovery } from './lib/recovery'
import './styles.css'

const recoveryIssue = checkStartupRecovery()

function Root() {
  const ignore = sessionStorage.getItem('vsm-ignore-startup-recovery') === '1'
  if (recoveryIssue.hasIssue && !ignore) return <StartupRecovery issue={recoveryIssue} onRecovered={() => location.reload()} />
  return <ErrorBoundary><App /></ErrorBoundary>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
