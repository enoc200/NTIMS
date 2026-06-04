'use client'
import { useState, useEffect } from 'react'
import Modal from './Modal'
import toast from 'react-hot-toast'
import type { User, Role } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  user?: User | null
}

const ROLES: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'STORE_MANAGER', label: 'Store Manager' },
  { value: 'SALES_ATTENDANT', label: 'Sales Attendant' },
]

export default function UserForm({ isOpen, onClose, onSaved, user }: Props) {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'SALES_ATTENDANT' as Role, active: true })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, username: user.username, email: user.email, password: '', role: user.role, active: user.active })
    } else {
      setForm({ name: '', username: '', email: '', password: '', role: 'SALES_ATTENDANT', active: true })
    }
  }, [user, isOpen])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user && !form.password) { toast.error('Password is required'); return }
    setLoading(true)
    try {
      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PUT' : 'POST'
      const body = {
        name: form.name,
        username: form.username,
        email: form.email,
        role: form.role,
        active: form.active,
        ...(user ? (form.password ? { password: form.password } : {}) : { password: form.password }),
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); return }
      toast.success(user ? 'User updated!' : 'User created!')
      onSaved()
      onClose()
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Add User'}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-control" placeholder="e.g. John Admin" value={form.name} onChange={e => update('name', e.target.value)} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="form-control" placeholder="e.g. admin" value={form.username} onChange={e => update('username', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-control form-select" value={form.role} onChange={e => update('role', e.target.value)} required>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Account Status</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
              />
              Active (can sign in)
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-control" type="email" placeholder="e.g. admin@store.com" value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">{user ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
            <input className="form-control" type="password" placeholder={user ? 'Leave blank to keep current' : 'Enter password'} value={form.password} onChange={e => update('password', e.target.value)} required={!user} />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : user ? 'Update User' : 'Add User'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
