'use client'
import { useState } from 'react'
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
  const [form] = useState(() => ({
    name: user?.name ?? '',
    username: user?.username ?? '',
    email: user?.email ?? '',
    password: '',
    role: (user?.role ?? 'SALES_ATTENDANT') as Role,
    active: user?.active ?? true,
  }))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formElement = e.currentTarget as HTMLFormElement
    const formData = new FormData(formElement)
    const nextForm = {
      name: String(formData.get('name') || '').trim(),
      username: String(formData.get('username') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || ''),
      role: String(formData.get('role') || 'SALES_ATTENDANT') as Role,
      active: formData.get('active') === 'on',
    }

    if (!user && !nextForm.password) { toast.error('Password is required'); return }
    setLoading(true)
    try {
      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PUT' : 'POST'
      const body = {
        name: nextForm.name,
        username: nextForm.username,
        email: nextForm.email,
        role: nextForm.role,
        active: nextForm.active,
        ...(user ? (nextForm.password ? { password: nextForm.password } : {}) : { password: nextForm.password }),
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
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Add User'} maxWidth={560}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input name="name" className="form-control" placeholder="e.g. John Admin" defaultValue={form.name} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input name="username" className="form-control" placeholder="e.g. admin" defaultValue={form.username} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select name="role" className="form-control form-select" defaultValue={form.role} required>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Account Status</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
              <input
                name="active"
                type="checkbox"
                defaultChecked={form.active}
              />
              Active (can sign in)
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input name="email" className="form-control" type="email" placeholder="e.g. admin@store.com" defaultValue={form.email} required />
          </div>
          <div className="form-group">
            <label className="form-label">{user ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
            <input name="password" className="form-control" type="password" placeholder={user ? 'Leave blank to keep current' : 'Enter password'} defaultValue={form.password} required={!user} />
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
