'use client'
import { useState } from 'react'
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
  const [form] = useState(() => ({
    name: product?.name ?? '',
    category: product?.category ?? '',
    price: product ? String(product.price) : '',
    stock: product ? String(product.stock) : '',
    minStock: product ? String(product.minStock) : '10',
    supplierId: product?.supplierId ? String(product.supplierId) : '',
  }))
  const [loading, setLoading] = useState(false)
  const [customCategory, setCustomCategory] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formElement = e.currentTarget as HTMLFormElement
    const formData = new FormData(formElement)
    const nextForm = {
      name: String(formData.get('name') || '').trim(),
      category: String(formData.get('category') || '').trim(),
      price: String(formData.get('price') || ''),
      stock: String(formData.get('stock') || ''),
      minStock: String(formData.get('minStock') || '10'),
      supplierId: String(formData.get('supplierId') || ''),
    }

    if (!nextForm.name || !nextForm.category || !nextForm.price || !nextForm.stock) return
    setLoading(true)
    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nextForm,
          price: Number(nextForm.price),
          stock: Number(nextForm.stock),
          minStock: Number(nextForm.minStock),
          supplierId: nextForm.supplierId ? Number(nextForm.supplierId) : null,
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
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Modify Inventory' : 'Add New Product'} maxWidth={680}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">
              <HiOutlineTag style={{ marginRight: 6 }} /> Product Identity
            </label>
            <input name="name" className="form-control" placeholder="Product Name" defaultValue={form.name} required />
          </div>

          <div className="form-group">
            <label className="form-label">
              <HiOutlineCollection style={{ marginRight: 6 }} /> Classification
            </label>
            {!customCategory ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <select name="category" className="form-control" defaultValue={form.category} required>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setCustomCategory(true)}>+ New</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <input name="category" className="form-control" placeholder="New category..." defaultValue={form.category} required />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setCustomCategory(false)}>List</button>
              </div>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                <HiOutlineCash style={{ marginRight: 6 }} /> Price
              </label>
              <input name="price" className="form-control" type="number" min="0" step="0.01" placeholder="0.00" defaultValue={form.price} required />
            </div>
            <div className="form-group">
              <label className="form-label">
                <HiOutlineCube style={{ marginRight: 6 }} /> Qty
              </label>
              <input name="stock" className="form-control" type="number" min="0" placeholder="0" defaultValue={form.stock} required />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <HiOutlineExclamationCircle style={{ marginRight: 6 }} /> Reorder Threshold
            </label>
            <input name="minStock" className="form-control" type="number" min="0" placeholder="10" defaultValue={form.minStock} />
          </div>

          <div className="form-group" style={{ marginTop: 20, marginBottom: 0 }}>
            <label className="form-label">
              <HiOutlineTruck style={{ marginRight: 6 }} /> Supplier
            </label>
            <select name="supplierId" className="form-control" defaultValue={form.supplierId}>
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
