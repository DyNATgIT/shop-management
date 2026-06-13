import { useState } from 'react'
import { AppState } from '../lib/types'
import { demoState } from '../lib/store'
import { fetchCloudState, getCloudMemberships } from '../lib/cloudSync'
import { Button, Card, Input, Select } from './ui'

type LoginMode = 'owner' | 'manager' | 'staff'

const env = (import.meta as any).env || {}
const ENV_SUPABASE_URL = env.VITE_SUPABASE_URL || ''
const ENV_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || ''

const roleRank: Record<string, number> = { staff: 1, manager: 2, owner: 3 }
const modeDescription = {
  owner: 'Full access: billing, stock, reports, settings, sync.',
  manager: 'Shop operations: billing, stock, rates, purchase, reports. No settings/security.',
  staff: 'Counter access: billing, customers, payments, wastage.'
}

export default function WebCloudLogin({ currentState, onLoad }: { currentState: AppState, onLoad: (state: AppState) => void }) {
  const [selectedMode, setSelectedMode] = useState<LoginMode>('staff')
  const [supabaseUrl, setSupabaseUrl] = useState(ENV_SUPABASE_URL || currentState.settings.supabaseUrl || 'https://bthabwdutxntytevsled.supabase.co')
  const [anonKey, setAnonKey] = useState(ENV_SUPABASE_ANON_KEY || currentState.settings.supabaseAnonKey || '')
  const [email, setEmail] = useState(currentState.settings.cloudEmail || '')
  const [password, setPassword] = useState('')
  const [memberships, setMemberships] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [session, setSession] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const signIn = async () => {
    setMessage(`Signing in as ${selectedMode}...`)
    try {
      const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) { setMessage(data?.error_description || data?.message || `Sign in failed: ${res.status}`); return }
      const settings = { ...currentState.settings, supabaseUrl, supabaseAnonKey: anonKey, cloudEmail: email, cloudUserId: data.user?.id || '', cloudAccessToken: data.access_token || '', cloudRefreshToken: data.refresh_token || '' }
      const rows = await getCloudMemberships(settings)
      setSession({ ...settings })
      setMemberships(rows)
      const firstAllowed = rows.find((row: any) => roleRank[row.role] >= roleRank[selectedMode])
      if (firstAllowed) setSelected(firstAllowed.shop_id)
      setMessage(rows.length ? `Signed in. Choose a shop to continue in ${selectedMode} mode.` : 'Signed in, but no shop membership found. If you are staff/manager, enter invite code below.')
    } catch (error) {
      setMessage(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const loadShop = async () => {
    const row = memberships.find(m => m.shop_id === selected)
    if (!session || !row) return
    if (roleRank[row.role] < roleRank[selectedMode]) {
      setMessage(`Access denied. This account is ${row.role}, so it cannot open ${selectedMode} mode.`)
      return
    }
    setMessage(`Loading ${selectedMode} mode...`)
    try {
      const settings = { ...session, cloudShopId: row.shop_id, cloudRole: selectedMode, actualCloudRole: row.role, cloudSyncEnabled: true }
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

  return <div className="web-login-page"><Card className="pad web-login-card"><h1>Vegetable Shop Manager</h1><p className="muted">Choose a login mode, then sign in. The selected mode is allowed only if your Supabase shop role has permission.</p><div className="role-select-grid">{(['owner', 'manager', 'staff'] as LoginMode[]).map(mode => <button key={mode} className={selectedMode === mode ? 'active' : ''} onClick={() => setSelectedMode(mode)}><b>{mode[0].toUpperCase() + mode.slice(1)} Login</b><small>{modeDescription[mode]}</small></button>)}</div>{(!ENV_SUPABASE_URL || !ENV_SUPABASE_ANON_KEY) && <div className="setup-warning"><b>Developer setup needed</b><small>Supabase env variables are missing. Enter them below for testing, or set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.</small></div>}<div className="form-grid">{!ENV_SUPABASE_URL && <Input value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} placeholder="Supabase URL"/>}{!ENV_SUPABASE_ANON_KEY && <Input value={anonKey} onChange={e => setAnonKey(e.target.value)} placeholder="Supabase anon key"/>}<Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"/><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"/><Button onClick={signIn}>Sign In as {selectedMode}</Button></div>{session && <div className="invite-join"><h3>Have an invite code?</h3><p className="muted">Staff and manager users can join a shop using an invite code from the owner.</p><div className="web-shop-select"><Input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="STAFF-XXXXXXXXXX or MANAGER-XXXXXXXXXX"/><Button variant="secondary" onClick={acceptInvite}>Join Shop</Button></div></div>}{memberships.length > 0 && <div className="web-shop-select"><Select value={selected} onChange={e => setSelected(e.target.value)}>{memberships.map(m => <option key={m.shop_id} value={m.shop_id}>{m.shops?.name || m.shop_id} — actual role: {m.role}</option>)}</Select><Button onClick={loadShop}>Continue as {selectedMode}</Button></div>}<p className="muted">{message}</p></Card></div>
}
