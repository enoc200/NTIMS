'use client'
import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import ReceiptModal from '@/components/ReceiptModal'
import { formatDateTime, formatKES, generateReceiptNumber } from '@/lib/utils'
import { HiOutlineShoppingCart, HiOutlineReceiptTax, HiOutlineTrash, HiOutlinePlus, HiOutlineMinus, HiOutlineCollection } from 'react-icons/hi'
import toast from 'react-hot-toast'
import type { Product, CartItem, Sale } from '@/types'

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>('')

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historySales, setHistorySales] = useState<Sale[]>([])
  const [historySearch, setHistorySearch] = useState('')
  const productList = Array.isArray(products) ? products : []

  async function fetchProducts() {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      if (!res.ok || !Array.isArray(data)) {
        setProducts([])
        const message = data?.error || 'Invalid products response'
        throw new Error(message)
      }
      setProducts(data)
    } catch {
      setProducts([])
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadProducts() {
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (!res.ok || !Array.isArray(data)) {
          if (active) setProducts([])
          return
        }
        if (active) setProducts(data)
      } catch {
        if (active) setProducts([])
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadProducts()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!historyOpen) return
    let active = true

    async function loadHistory() {
      setHistoryLoading(true)
      try {
        const response = await fetch('/api/sales')
        const data = await response.json()
        if (active) setHistorySales(Array.isArray(data) ? data : [])
      } catch {
        toast.error('Failed to fetch receipts')
      } finally {
        if (active) setHistoryLoading(false)
      }
    }

    void loadHistory()
    return () => {
      active = false
    }
  }, [historyOpen])

  const filteredHistory = historySearch.trim()
    ? historySales.filter(s => s.receiptNumber.toLowerCase().includes(historySearch.trim().toLowerCase()))
    : historySales

  function addToCart(product: Product) {
    if (product.stock <= 0) {
      toast.error('Product is out of stock')
      return
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Cannot add more than available stock')
          return prev
        }
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1
      }]
    })
  }

  function updateQuantity(productId: number, delta: number) {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const product = products.find(p => p.id === productId)
          const newQty = item.quantity + delta
          if (newQty <= 0) return item
          if (product && newQty > product.stock) {
            toast.error('Not enough stock')
            return item
          }
          return { ...item, quantity: newQty }
        }
        return item
      })
    })
  }

  function removeFromCart(productId: number) {
    setCart(prev => prev.filter(item => item.productId !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  async function completeSale() {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          receiptNumber: generateReceiptNumber()
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to complete sale')
      }

      const sale = await res.json()
      setReceiptSale(sale)
      setIsReceiptOpen(true)
      setCart([])
      void fetchProducts()
      toast.success('Sale completed successfully')
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Failed to complete sale')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Point of Sale</h1>
          <p className="page-subtitle">Process customer transactions and generate receipts</p>
        </div>
        <button className="btn btn-outline" onClick={() => setHistoryOpen(true)}>
          <HiOutlineCollection style={{ fontSize: '18px' }} />
          Recent Orders
        </button>
      </div>

      <div className="pos-layout">
        <div className="pos-main">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ fontSize: '16px' }}>Product Selection</h2>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ display: 'flex', gap: 12 }}>
                <select 
                  className="form-control" 
                  style={{ flex: 1 }}
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                >
                  <option value="">Search or select product...</option>
                  {productList.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} — {formatKES(p.price)} ({p.stock} in stock)
                    </option>
                  ))}
                </select>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const p = productList.find(p => p.id === Number(selectedProductId))
                    if (p) addToCart(p)
                    setSelectedProductId('')
                  }}
                  disabled={!selectedProductId}
                >
                  <HiOutlinePlus /> Add to Cart
                </button>
              </div>

              <div className="product-grid" style={{ marginTop: 24 }}>
                {productList.map(product => (
                  <div 
                    key={product.id} 
                    className={`product-item ${product.stock <= 0 ? 'out-of-stock' : ''}`}
                    onClick={() => addToCart(product)}
                  >
                    <div className="product-item-name">{product.name}</div>
                    <div className="product-item-price">{formatKES(product.price)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                      {product.stock} available
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pos-sidebar">
          <div className="cart-panel">
            <div className="cart-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HiOutlineShoppingCart style={{ fontSize: '20px', color: 'var(--primary)' }} />
                <h2 className="card-title" style={{ fontSize: '16px' }}>Checkout Cart</h2>
              </div>
              <span className="badge badge-admin">{cart.length} Items</span>
            </div>
            
            <div className="cart-items">
              {cart.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                  <HiOutlineShoppingCart style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.2 }} />
                  <p>Cart is currently empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} className="cart-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="font-semibold text-sm">{item.productName}</span>
                      <button className="btn-icon danger" onClick={() => removeFromCart(item.productId)}>
                        <HiOutlineTrash />
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button className="qty-btn" onClick={() => updateQuantity(item.productId, -1)}><HiOutlineMinus /></button>
                        <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.productId, 1)}><HiOutlinePlus /></button>
                      </div>
                      <span className="font-semibold">{formatKES(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatKES(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HiOutlineReceiptTax /> Sales Tax (8%)
                </span>
                <span>{formatKES(tax)}</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>{formatKES(total)}</span>
              </div>
              
              <button 
                className="btn btn-primary btn-lg" 
                style={{ marginTop: 24, width: '100%', height: '52px' }}
                onClick={completeSale}
                disabled={submitting || cart.length === 0}
              >
                {submitting ? 'Processing Transaction...' : 'Complete Purchase'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReceiptModal 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
        sale={receiptSale} 
      />

      <Modal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Recent Transactions"
        maxWidth={720}
      >
        <div className="modal-body">
          <div className="form-group">
            <input
              className="form-control"
              placeholder="Search by receipt number..."
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            {historyLoading ? (
              <LoadingSpinner />
            ) : filteredHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>No transactions found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredHistory.map(sale => (
                  <div
                    key={sale.id}
                    className="card"
                    style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => {
                      setReceiptSale(sale)
                      setIsReceiptOpen(true)
                      setHistoryOpen(false)
                    }}
                  >
                    <div>
                      <div className="font-semibold">{sale.receiptNumber}</div>
                      <div className="text-muted text-sm">{formatDateTime(sale.createdAt)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-semibold" style={{ color: 'var(--primary)' }}>{formatKES(sale.total)}</div>
                      <div className="text-sm">{sale.items.length} items</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
