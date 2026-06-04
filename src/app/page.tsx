'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const DEMO_ACCOUNTS = [
  { label: 'Administrator', username: 'admin', password: 'admin123', color: '#1a6ef5' },
  { label: 'Store Manager', username: 'manager', password: 'manager123', color: '#14b8a6' },
  { label: 'Sales Attendant', username: 'sales', password: 'sales123', color: '#8b5cf6' },
]

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<string | null>(null)

  async function handleLogin(u: string, p: string, isDemo = false) {
    if (isDemo) setDemoLoading(u)
    else setLoading(true)
    const res = await signIn('credentials', { username: u, password: p, redirect: false })
    if (res?.ok) {
      toast.success('Welcome back!')
      router.push('/dashboard')
    } else {
      toast.error('Invalid username or password')
    }
    setLoading(false)
    setDemoLoading(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a6ef5 0%, #1558d6 50%, #0f3fa8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #1a6ef5, #1558d6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '26px' }}>
            🛒
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>SME Inventory System</h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Smart inventory management for your business</p>
        </div>

        {/* Form */}
        <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#111827', marginBottom: '18px' }}>Sign In</h2>
        <form onSubmit={e => { e.preventDefault(); handleLogin(username, password) }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-control" type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-control" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: '40px' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? '⏳ Signing in...' : '→ Sign In'}
          </button>
        </form>

        {/* Demo Accounts */}
        <div style={{ marginTop: '24px', background: '#f8faff', borderRadius: '10px', padding: '16px', border: '1px solid #e8f0fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Demo Accounts</span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Click to sign in instantly</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.username} onClick={() => handleLogin(acc.username, acc.password, true)} disabled={!!demoLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fff', border: `1px solid #e5e7eb`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', fontSize: '13px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = acc.color; (e.currentTarget as HTMLButtonElement).style.background = '#f8faff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: acc.color }}></div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', color: '#374151' }}>{acc.label}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{acc.username} / {acc.password}</div>
                  </div>
                </div>
                {demoLoading === acc.username ? <span style={{ fontSize: '12px', color: '#9ca3af' }}>...</span> : <span style={{ color: acc.color, fontSize: '16px' }}>→</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
