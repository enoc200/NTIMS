'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ProductForm from '@/components/ProductForm'
import { formatKES } from '@/lib/utils'
import { HiOutlinePlus, HiOutlineSearch, HiOutlineFilter, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineExclamation } from 'react-icons/hi'
import toast from 'react-hot-toast'
import type { Product, Supplier } from '@/types'

export default function ProductsPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [stockLevel, setStockLevel] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const role = session?.user?.role
  const productList = Array.isArray(products) ? products : []

  async function fetchData() {
    setLoading(true)
    try {
      const query = new URLSearchParams({ search, category, stockLevel }).toString()
      const [resP, resC, resS] = await Promise.all([
        fetch(`/api/products?${query}`),
        fetch('/api/categories'),
        fetch('/api/suppliers')
      ])
      const dataP = await resP.json()
      const dataC = await resC.json()
      const dataS = await resS.json()

      if (!resP.ok || !Array.isArray(dataP)) {
        setProducts([])
        const errorMessage = dataP?.error || 'Invalid products response'
        throw new Error(errorMessage)
      }

      setProducts(dataP)
      setCategories(Array.isArray(dataC) ? dataC : [])
      setSuppliers(Array.isArray(dataS) ? dataS : [])
    } catch (error) {
      setProducts([])
      setCategories([])
      setSuppliers([])
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, category, stockLevel])

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Product deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  function openEdit(p: Product) {
    setEditingProduct(p)
    setIsFormOpen(true)
  }

  function openAdd() {
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Product Inventory</h1>
          <p className="page-subtitle">Manage your catalog, stock levels, and categories</p>
        </div>
        {role !== 'SALES_ATTENDANT' && (
          <button className="btn btn-primary" onClick={openAdd}>
            <HiOutlinePlus style={{ fontSize: '18px' }} />
            Add New Product
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <HiOutlineSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              className="form-control"
              style={{ paddingLeft: '40px' }}
              placeholder="Search by product name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <HiOutlineFilter style={{ color: 'var(--gray-400)' }} />
            <select className="form-control" style={{ width: '180px' }} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-control" style={{ width: '180px' }} value={stockLevel} onChange={e => setStockLevel(e.target.value)}>
              <option value="">All Stock Status</option>
              <option value="ok">Healthy Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {productList.map(product => {
            const isLow = product.stock > 0 && product.stock <= product.minStock
            const isOut = product.stock === 0
            return (
              <div key={product.id} className="card" style={{ borderTop: isOut ? '4px solid var(--danger)' : isLow ? '4px solid var(--warning)' : 'none' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span className="badge badge-admin">{product.category}</span>
                    {role !== 'SALES_ATTENDANT' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" onClick={() => openEdit(product)}><HiOutlinePencilAlt /></button>
                        <button className="btn-icon danger" onClick={() => handleDelete(product.id)}><HiOutlineTrash /></button>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-semibold" style={{ fontSize: '16px', marginBottom: 4 }}>{product.name}</h3>
                  <div className="text-sm" style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '18px', marginBottom: 16 }}>
                    {formatKES(product.price)}
                  </div>
                  <div className="text-sm text-muted" style={{ marginBottom: 12 }}>
                    Supplier: {product.supplier?.name || 'Unassigned'}
                  </div>

                  <div style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 4 }}>
                      <span className="text-muted">Available Stock</span>
                      <span className="font-semibold" style={{ color: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)' }}>
                        {product.stock} Units
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span className="text-muted">Threshold</span>
                      <span className="font-semibold">{product.minStock} Units</span>
                    </div>
                  </div>

                  {isLow && !isOut && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warning)', fontSize: '12px', fontWeight: 700 }}>
                      <HiOutlineExclamation /> Low stock warning
                    </div>
                  )}
                  {isOut && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontSize: '12px', fontWeight: 700 }}>
                      <HiOutlineExclamation /> Out of stock
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {productList.length === 0 && !loading && (
        <div className="card" style={{ padding: 80, textAlign: 'center' }}>
          <p className="text-muted">No products found matching your criteria</p>
        </div>
      )}

      <ProductForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={fetchData}
        product={editingProduct}
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  )
}
