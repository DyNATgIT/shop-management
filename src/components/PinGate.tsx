import { useState } from 'react'
import { Button, Card, Input } from './ui'
import { verifyPin } from '../lib/security'

export default function PinGate({ settings, onUnlock }: { settings: any, onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const submit = async () => {
    if (await verifyPin(pin, settings)) {
      setError('')
      setPin('')
      onUnlock()
    } else {
      setError('Wrong PIN')
    }
  }
  return <div className="pin-wrap"><Card className="pad pin-card"><div className="pin-icon">🔒</div><h2>Owner PIN Required</h2><p className="muted">Reports, Settings, cloud sync, restore/reset and profit information are protected.</p><Input autoFocus type="password" inputMode="numeric" placeholder="Enter owner PIN" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit() }} />{error && <p className="pin-error">{error}</p>}<Button className="full" onClick={submit}>Unlock</Button></Card></div>
}
