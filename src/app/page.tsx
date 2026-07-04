'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (res?.ok) {
        toast.success('Welcome back!')
        router.push('/dashboard')
        return
      }

      toast.error('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.shell}>
        <aside className={styles.brandPanel}>
          <div className={styles.brandBadge}>NEW TECH IMS</div>
          <div className={styles.brandMark}>
            <span>🛒</span>
          </div>
          <h1>Inventory, sales, and team control in one place.</h1>
          <p>
            Manage stock, track sales, and keep your store moving with a fast,
            focused dashboard built for day-to-day operations.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <span className={styles.featureDot} />
              <span>Live stock visibility with low-inventory alerts</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureDot} />
              <span>Quick POS checkout with receipts and totals</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureDot} />
              <span>Role-based access for admins, managers, and staff</span>
            </div>
          </div>
        </aside>

        <section className={styles.formPanel}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <div className={styles.formKicker}>Secure sign in</div>
              <h2>Welcome back</h2>
              <p>Enter your workspace credentials to continue.</p>
            </div>

            <form
              className={styles.form}
              onSubmit={e => {
                e.preventDefault()
                handleLogin()
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  className="form-control"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div className={styles.passwordField}>
                  <input
                    id="password"
                    className="form-control"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className={styles.securityNote}>
              Authorized staff only. Contact your administrator if you cannot
              access your account.
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}
