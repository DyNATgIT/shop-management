import { useState } from 'react'
import { AppState } from '../lib/types'
import { demoState } from '../lib/store'
import { fetchCloudState, getCloudMemberships } from '../lib/cloudSync'
import { Button, Card, Input, Select } from './ui'

export default function WebCloudLogin({ currentState, onLoad }: { currentState: AppState, onLoad: (state: AppState) => void }) {
  const [supabaseUrl, setSupabaseUrl] = useState(currentState.settings.supabaseUrl || 'https://bthabwdutxntytevsled.supabase.co')
  const [anonKey, setAnonKey] = useState(currentState.settings.supabaseAnonKey || '')
  const [email, setEmail] = useState(currentState.settings.cloudEmail || '')
  const [password, setPassword] = useState('')
  const [memberships, setMemberships] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [session, setSession] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const signIn = async () => {
    setMessage('Signing in...')
    try {
      const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) { setMessage(data?.error_description || data?.message || `Sign in failed: ${res.status}`); return }
      const settings = { ...currentState.settings, supabaseUrl, supabaseAnonKey: anonKey, cloudEmail: email, cloudUserId: data.user?.id || '', cloudAccessToken: data.access_token || '', cloudRefreshToken: data.refresh_token || '' }
      const rows = await getCloudMemberships(settings)
      setSession({ ...settings })
      setMemberships(rows)
      if (rows[0]) setSelected(rows[0].shop_id)
      setMessage(rows.length ? 'Signed in. Your role is loaded from Supabase. Select a shop to continue.' : 'Signed in, but no shop membership found. Ask the owner to add this email to shop_users.')
    } catch (error) {
      setMessage(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const loadShop = async () => {
    const row = memberships.find(m => m.shop_id === selected)
    if (!session || !row) return
    setMessage(`Loading ${row.role} mode...`)
    try {
      const settings = { ...session, cloudShopId: row.shop_id, cloudRole: row.role, cloudSyncEnabled: true }
      const loaded = await fetchCloudState({ ...demoState, ...currentState, settings: { ...demoState.settings, ...currentState.settings, ...settings } }, settings)
      onLoad(loaded)
    } catch (error) {
      setMessage(`Load failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const acceptInvite = async () => {
    if (!session) { setMessage('Sign in first, then enter invite code.'); return }
    if (!inviteCode.trim()) { setMessage('Enter invite code.'); return }
    setMessage('Accepting invite...')
    try {
      const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/accept_shop_invite`, {
        method: 'POST',
        headers: { apikey: anonKey, Authorization: `Bearer ${session.cloudAccessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_code: inviteCode.trim().toUpperCase() })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setMessage(data?.message || data?.hint || `Invite failed: ${res.status}`); return }
      const rows = await getCloudMemberships(session)
      setMemberships(rows)
      setSelected(typeof data === 'string' ? data : rows[0]?.shop_id || '')
      setInviteCode('')
      setMessage('Invite accepted. Select shop and continue.')
    } catch (error) {
      setMessage(`Invite failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return <div className="web-login-page"><Card className="pad web-login-card"><h1>Owner / Manager / Staff Login</h1><p className="muted">Sign in with Supabase. The app checks your role from <b>shop_users</b> and opens the correct mode automatically.</p><div className="role-preview"><div><b>Owner</b><small>Full access: billing, stock, reports, settings, sync.</small></div><div><b>Manager</b><small>Shop operations: billing, stock, rates, purchase, reports. No settings/security.</small></div><div><b>Staff</b><small>Counter access: billing, customers, payments, wastage.</small></div></div><div className="form-grid"><Input value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} placeholder="Supabase URL"/><Input value={anonKey} onChange={e => setAnonKey(e.target.value)} placeholder="Supabase anon key"/><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"/><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"/><Button onClick={signIn}>Sign In</Button></div>{session && <div className="invite-join"><h3>Have an invite code?</h3><div className="web-shop-select"><Input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="STAFF-XXXXXXXXXX or MANAGER-XXXXXXXXXX"/><Button variant="secondary" onClick={acceptInvite}>Join Shop</Button></div></div>}{memberships.length > 0 && <div className="web-shop-select"><Select value={selected} onChange={e => setSelected(e.target.value)}>{memberships.map(m => <option key={m.shop_id} value={m.shop_id}>{m.shops?.name || m.shop_id} — {m.role}</option>)}</Select><Button onClick={loadShop}>Continue</Button></div>}<p className="muted">{message}</p></Card></div>
}
