import { useMemo, useState } from 'react'
import { AppState } from '../lib/types'
import { demoState } from '../lib/store'
import { fetchCloudState, getCloudMemberships } from '../lib/cloudSync'
import { Button, Card, Input, Select } from './ui'

type LoginMode = 'owner' | 'manager' | 'staff'

const env = (import.meta as any).env || {}
const ENV_SUPABASE_URL = env.VITE_SUPABASE_URL || ''
const ENV_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || ''
const roleRank: Record<string, number> = { staff: 1, manager: 2, owner: 3 }
const modeCopy = {
  owner: {
    title: 'Owner Login',
    label: 'Owner',
    description: 'Complete control for reports, settings, sync, team and security.',
    bullets: ['Full reports', 'Cloud sync', 'Team control']
  },
  manager: {
    title: 'Manager Login',
    label: 'Manager',
    description: 'Operate the shop: stock, rates, purchases, billing and reports.',
    bullets: ['Stock & rates', 'Purchases', 'Reports']
  },
  staff: {
    title: 'Staff Login',
    label: 'Staff',
    description: 'Fast counter access for billing, payments, customers and wastage.',
    bullets: ['Fast billing', 'Payments', 'Wastage']
  }
}

function getShop(row: any) {
  return Array.isArray(row.shops) ? row.shops[0] : row.shops
}

function shopTime(row: any) {
  const shop = getShop(row)
  return new Date(shop?.updated_at || shop?.created_at || row.created_at || 0).getTime()
}

function dedupeMemberships(rows: any[]) {
  if (!rows.length) return []
  const newest = [...rows].sort((a, b) => shopTime(b) - shopTime(a))[0]
  return newest ? [newest] : []
}

function shopName(row: any) {
  return getShop(row)?.name || row.shop_id || 'Shop'
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
  const uniqueMemberships = useMemo(() => dedupeMemberships(memberships), [memberships])
  const activeMode = modeCopy[selectedMode]

  const signIn = async () => {
    setMessage(`Signing in as ${activeMode.label}...`)
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
      const unique = dedupeMemberships(rows)
      setSession({ ...settings })
      setMemberships(rows)
      const firstAllowed = unique.find((row: any) => roleRank[row.role] >= roleRank[selectedMode])
      if (firstAllowed) setSelected(firstAllowed.shop_id)
      setMessage(unique.length ? `Signed in. ${rows.length !== unique.length ? 'Duplicate shop names were simplified to one option. ' : ''}Choose a shop to continue in ${activeMode.label} mode.` : 'Signed in, but no shop membership found. If you are staff/manager, enter invite code below.')
    } catch (error) {
      setMessage(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const loadShop = async () => {
    const row = uniqueMemberships.find(m => m.shop_id === selected)
    if (!session || !row) return
    if (roleRank[row.role] < roleRank[selectedMode]) {
      setMessage(`Access denied. This account is ${row.role}, so it cannot open ${selectedMode} mode.`)
      return
    }
    setMessage(`Loading ${activeMode.label} mode...`)
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
      const unique = dedupeMemberships(rows)
      setMemberships(rows)
      setSelected(typeof data === 'string' ? data : unique[0]?.shop_id || '')
      setInviteCode('')
      setMessage('Invite accepted. Select shop and continue.')
    } catch (error) {
      setMessage(`Invite failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return <div className="web-login-page fresh-login-page">
    <div className="login-ambient login-ambient-a"></div>
    <div className="login-ambient login-ambient-b"></div>
    <div className="login-ambient login-ambient-c"></div>
    <div className="fresh-login-shell">
      <section className="fresh-login-hero">
        <div className="login-kicker">Cloud POS access</div>
        <h1>Run your vegetable shop from counter to cloud.</h1>
        <p>Fast billing for staff, stock control for managers, and reports/security for owners — all separated by real Supabase roles.</p>
        <div className="fresh-login-stats">
          <div><b>3</b><span>secure roles</span></div>
          <div><b>80mm</b><span>receipt ready</span></div>
          <div><b>SQLite</b><span>desktop backup</span></div>
        </div>
        <div className="fresh-login-flow">
          <span>Sign in</span><i></i><span>Verify role</span><i></i><span>Open shop</span>
        </div>
      </section>

      <Card className="pad web-login-card fresh-login-card">
        <div className="login-card-head">
          <div>
            <div className="login-kicker subtle">Secure login</div>
            <h2>{activeMode.title}</h2>
            <p className="muted">{activeMode.description}</p>
          </div>
        </div>

        <div className="role-select-grid refined-roles">
          {(['owner', 'manager', 'staff'] as LoginMode[]).map(mode => <button key={mode} className={selectedMode === mode ? 'active' : ''} onClick={() => setSelectedMode(mode)}>
            <span className="role-dot">{mode === 'owner' ? 'O' : mode === 'manager' ? 'M' : 'S'}</span>
            <b>{modeCopy[mode].label}</b>
            <small>{modeCopy[mode].bullets.join(' • ')}</small>
          </button>)}
        </div>

        {(!ENV_SUPABASE_URL || !ENV_SUPABASE_ANON_KEY) && <div className="setup-warning"><b>Developer setup needed</b><small>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel to hide technical fields.</small></div>}

        <div className="login-form-grid">
          {!ENV_SUPABASE_URL && <Input value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} placeholder="Supabase URL"/>}
          {!ENV_SUPABASE_ANON_KEY && <Input value={anonKey} onChange={e => setAnonKey(e.target.value)} placeholder="Supabase anon key"/>}
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"/>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" onKeyDown={e => { if (e.key === 'Enter') signIn() }} />
          <Button className="login-primary" onClick={signIn}>Sign In as {activeMode.label}</Button>
        </div>

        {session && <div className="invite-join"><h3>Have an invite code?</h3><p className="muted">Staff and manager users can join a shop using an invite code from the owner.</p><div className="web-shop-select"><Input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="STAFF-XXXXXXXXXX or MANAGER-XXXXXXXXXX"/><Button variant="secondary" onClick={acceptInvite}>Join Shop</Button></div></div>}

        {uniqueMemberships.length > 0 && <div className="shop-picker-card"><div><b>Choose shop</b><small>Only the latest matching shop is shown to avoid duplicates.</small></div><div className="web-shop-select"><Select value={selected} onChange={e => setSelected(e.target.value)}>{uniqueMemberships.map(m => <option key={m.shop_id} value={m.shop_id}>{shopName(m)} — actual role: {m.role}</option>)}</Select><Button onClick={loadShop}>Continue</Button></div></div>}

        {memberships.length > uniqueMemberships.length && <p className="muted">Duplicate shops with the same name were simplified. The newest matching shop is shown.</p>}
        {message && <div className="login-message">{message}</div>}
      </Card>
    </div>
  </div>
}
