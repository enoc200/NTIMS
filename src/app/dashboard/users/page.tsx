'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'
import UserForm from '@/components/UserForm'
import type { User } from '@/types'
import { getRoleLabel } from '@/lib/utils'
import { HiOutlineUserAdd, HiOutlineSearch, HiOutlineMail, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineUserCircle } from 'react-icons/hi'

export default function UsersPage() {
  const { data: session } = useSession()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to fetch users')
      }
      const data = await res.json()
      setUsers(data)
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session) return
    fetchUsers()
  }, [session])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(u => (u.name + ' ' + u.username + ' ' + u.email).toLowerCase().includes(q))
  }, [users, search])

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to delete user')
      }
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Failed to delete user')
    }
  }

  function openAdd() {
    setEditingUser(null)
    setIsFormOpen(true)
  }

  function openEdit(u: User) {
    setEditingUser(u)
    setIsFormOpen(true)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Team Management</h1>
          <p className="page-subtitle">Manage system users, roles, and account statuses</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <HiOutlineUserAdd style={{ fontSize: '18px' }} />
          Add Team Member
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ position: 'relative', maxWidth: '520px' }}>
            <HiOutlineSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              className="form-control"
              style={{ paddingLeft: '40px' }}
              placeholder="Search by name, username or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="card" style={{ padding: 80, textAlign: 'center' }}>
          <HiOutlineUserCircle style={{ fontSize: 64, color: 'var(--gray-200)', marginBottom: 16 }} />
          <p className="text-muted">No team members found matching your search</p>
        </div>
      ) : (
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filteredUsers.map(u => (
            <div key={u.id} className="card user-card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div className="user-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`badge ${u.active ? 'bg-success-light' : 'bg-danger-light'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <h3 className="font-semibold" style={{ fontSize: '16px' }}>{u.name}</h3>
                  <div className="text-muted text-sm">@{u.username}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: 'var(--gray-600)' }}>
                    <HiOutlineMail /> {u.email}
                  </div>
                  <div className="badge badge-admin" style={{ alignSelf: 'flex-start' }}>
                    {getRoleLabel(u.role)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--gray-100)', paddingTop: 16 }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => openEdit(u)}>
                    <HiOutlinePencilAlt /> Edit
                  </button>
                  <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--gray-200)' }} onClick={() => handleDelete(u.id)}>
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <UserForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={fetchUsers}
        user={editingUser}
      />
    </div>
  )
}
