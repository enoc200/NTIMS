'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/components/Modal'
import LoadingSpinner from '@/components/LoadingSpinner'
import type { Supplier } from '@/types'
import {
  HiOutlineMail,
  HiOutlineOfficeBuilding,
  HiOutlinePencilAlt,
  HiOutlinePhone,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineTruck,
  HiOutlineUser,
} from 'react-icons/hi'

type SupplierFormState = {
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  active: boolean
}

const EMPTY_FORM: SupplierFormState = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  active: true,
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [form, setForm] = useState<SupplierFormState>(EMPTY_FORM)

  const fetchSuppliers = useCallback(async function fetchSuppliers() {
    setLoading(true)
    try {
      const query = new URLSearchParams({ search, status }).toString()
      const response = await fetch(`/api/suppliers?${query}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch suppliers')
      setSuppliers(data)
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    const timer = setTimeout(fetchSuppliers, 300)
    return () => clearTimeout(timer)
  }, [fetchSuppliers])

  const totals = useMemo(() => ({
    active: suppliers.filter(supplier => supplier.active).length,
    inactive: suppliers.filter(supplier => !supplier.active).length,
    linkedProducts: suppliers.reduce((sum, supplier) => sum + (supplier.productCount || 0), 0),
  }), [suppliers])

  function update(field: keyof SupplierFormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function openAdd() {
    setEditingSupplier(null)
    setForm(EMPTY_FORM)
    setIsFormOpen(true)
  }

  function openEdit(supplier: Supplier) {
    setEditingSupplier(supplier)
    setForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      active: supplier.active,
    })
    setIsFormOpen(true)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.name.trim()) return

    setSaving(true)
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers'
      const method = editingSupplier ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to save supplier')

      toast.success(editingSupplier ? 'Supplier updated' : 'Supplier created')
      setIsFormOpen(false)
      fetchSuppliers()
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Failed to save supplier')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(supplier: Supplier) {
    if (!confirm(`Delete ${supplier.name}?`)) return

    try {
      const response = await fetch(`/api/suppliers/${supplier.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to delete supplier')

      toast.success('Supplier deleted')
      fetchSuppliers()
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Failed to delete supplier')
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Manage sourcing contacts and link them to inventory items</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <HiOutlinePlus style={{ fontSize: 18 }} />
          Add Supplier
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="vibrant-card primary">
          <div className="vibrant-label">Total Suppliers</div>
          <div className="vibrant-value">{suppliers.length}</div>
        </div>
        <div className="vibrant-card success">
          <div className="vibrant-label">Active Suppliers</div>
          <div className="vibrant-value">{totals.active}</div>
        </div>
        <div className="vibrant-card warning">
          <div className="vibrant-label">Inactive Suppliers</div>
          <div className="vibrant-value">{totals.inactive}</div>
        </div>
        <div className="vibrant-card info">
          <div className="vibrant-label">Linked Products</div>
          <div className="vibrant-value">{totals.linkedProducts}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <HiOutlineSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              className="form-control"
              style={{ paddingLeft: 40 }}
              placeholder="Search by supplier, contact, phone or email..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
          <select className="form-control" style={{ width: 180 }} value={status} onChange={event => setStatus(event.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : suppliers.length === 0 ? (
        <div className="card" style={{ padding: 80, textAlign: 'center' }}>
          <HiOutlineTruck style={{ fontSize: 64, color: 'var(--gray-200)', marginBottom: 16 }} />
          <p className="text-muted">No suppliers found.</p>
        </div>
      ) : (
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {suppliers.map(supplier => (
            <div key={supplier.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12 }}>
                  <div>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 12 }}>
                      <HiOutlineTruck />
                    </div>
                    <h3 className="font-semibold" style={{ fontSize: 17 }}>{supplier.name}</h3>
                    <div className="text-sm text-muted">{supplier.productCount || 0} linked products</div>
                  </div>
                  <span className={`badge ${supplier.active ? 'bg-success-light' : 'bg-danger-light'}`}>
                    {supplier.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 110 }}>
                  <div className="text-sm" style={{ display: 'flex', gap: 8, color: 'var(--gray-600)' }}>
                    <HiOutlineUser /> {supplier.contactPerson || 'No contact person'}
                  </div>
                  <div className="text-sm" style={{ display: 'flex', gap: 8, color: 'var(--gray-600)' }}>
                    <HiOutlinePhone /> {supplier.phone || 'No phone number'}
                  </div>
                  <div className="text-sm" style={{ display: 'flex', gap: 8, color: 'var(--gray-600)' }}>
                    <HiOutlineMail /> {supplier.email || 'No email address'}
                  </div>
                  <div className="text-sm" style={{ display: 'flex', gap: 8, color: 'var(--gray-600)' }}>
                    <HiOutlineOfficeBuilding /> {supplier.address || 'No address'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--gray-100)', paddingTop: 16, marginTop: 18 }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => openEdit(supplier)}>
                    <HiOutlinePencilAlt /> Edit
                  </button>
                  <button className="btn btn-outline" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(supplier)}>
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        maxWidth={520}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Supplier Name</label>
              <input className="form-control" value={form.name} onChange={event => update('name', event.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input className="form-control" value={form.contactPerson} onChange={event => update('contactPerson', event.target.value)} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={event => update('phone', event.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={event => update('email', event.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-control" rows={3} value={form.address} onChange={event => update('address', event.target.value)} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
              <input type="checkbox" checked={form.active} onChange={event => update('active', event.target.checked)} />
              Supplier is active
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
