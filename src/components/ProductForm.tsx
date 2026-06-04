'use client'
import { useState, useEffect } from 'react'
import Modal from './Modal'
import toast from 'react-hot-toast'
import { HiOutlineCube, HiOutlineTag, HiOutlineCash, HiOutlineCollection, HiOutlineExclamationCircle, HiOutlineTruck } from 'react-icons/hi'
import type { Product, Supplier } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  product?: Product | null
  categories: string[]
  suppliers: Supplier[]
}

export default function ProductForm({ isOpen, onClose, onSaved, product, categories, suppliers }: Props) {
  const [form, setForm] = useState({ name: '', category: '', price: '', stock: '', minStock: '10', supplierId: '' })
  const [loading, setLoading] = useState(false)
  const [customCategory, setCustomCategory] = useState(false)

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        category: product.category,
        price: String(product.price),
        stock: String(product.stock),
        minStock: String(product.minStock),
        supplierId: product.supplierId ? String(product.supplierId) : '',
      })
    } else {
      setForm({ name: '', category: '', price: '', stock: '', minStock: '10', supplierId: '' })
    }
    setCustomCategory(false)
  }, [product, isOpen])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.category || !form.price || !form.stock) return
    setLoading(true)
    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
          minStock: Number(form.minStock),
          supplierId: form.supplierId ? Number(form.supplierId) : null,
        }),
      })
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); return }
      toast.success(product ? 'Product updated successfully' : 'Product created successfully')
      onSaved()
      onClose()
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Modify Inventory' : 'Add New Product'} maxWidth={420}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">
              <HiOutlineTag style={{ marginRight: 6 }} /> Product Identity
            </label>
            <input className="form-control" placeholder="Product Name" value={form.name} onChange={e => update('name', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">
              <HiOutlineCollection style={{ marginRight: 6 }} /> Classification
            </label>
            {!customCategory ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <select className="form-control" value={form.category} onChange={e => update('category', e.target.value)} required>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setCustomCategory(true)}>+ New</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="form-control" placeholder="New category..." value={form.category} onChange={e => update('category', e.target.value)} required />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setCustomCategory(false)}>List</button>
              </div>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                <HiOutlineCash style={{ marginRight: 6 }} /> Price
              </label>
              <input className="form-control" type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => update('price', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">
                <HiOutlineCube style={{ marginRight: 6 }} /> Qty
              </label>
              <input className="form-control" type="number" min="0" placeholder="0" value={form.stock} onChange={e => update('stock', e.target.value)} required />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <HiOutlineExclamationCircle style={{ marginRight: 6 }} /> Reorder Threshold
            </label>
            <input className="form-control" type="number" min="0" placeholder="10" value={form.minStock} onChange={e => update('minStock', e.target.value)} />
          </div>

          <div className="form-group" style={{ marginTop: 20, marginBottom: 0 }}>
            <label className="form-label">
              <HiOutlineTruck style={{ marginRight: 6 }} /> Supplier
            </label>
            <select className="form-control" value={form.supplierId} onChange={e => update('supplierId', e.target.value)}>
              <option value="">No supplier selected</option>
              {suppliers.filter(supplier => supplier.active || supplier.id === product?.supplierId).map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}{supplier.active ? '' : ' (Inactive)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Discard</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : product ? 'Update Inventory' : 'Confirm & Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
