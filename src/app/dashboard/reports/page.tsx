'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatDate, formatKES } from '@/lib/utils'
import type { ProductReportItem, ReportsData } from '@/types'
import {
  HiOutlineCash,
  HiOutlineChartBar,
  HiOutlineCube,
  HiOutlineExclamationCircle,
  HiOutlineShoppingBag,
  HiOutlineTrendingUp,
} from 'react-icons/hi'

type ReportTab = 'sales' | 'products'

function getStatusBadgeClass(product: ProductReportItem) {
  if (product.stockStatus === 'Out of Stock') return 'bg-danger-light'
  if (product.stockStatus === 'Low Stock') return 'bg-warning-light'
  return 'bg-success-light'
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ReportTab>('sales')
  const [productSearch, setProductSearch] = useState('')

  useEffect(() => {
    fetch('/api/reports')
      .then(async response => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Failed to load reports')
        return payload as ReportsData
      })
      .then(payload => {
        setData(payload)
        if (!payload.canViewSalesReport) setActiveTab('products')
      })
      .catch((error: unknown) => {
        const err = error as { message?: string }
        toast.error(err.message || 'Failed to load reports')
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = useMemo(() => {
    const products = data?.productReport.products || []
    const query = productSearch.trim().toLowerCase()
    if (!query) return products
    return products.filter(product =>
      `${product.name} ${product.category} ${product.stockStatus}`.toLowerCase().includes(query)
    )
  }, [data, productSearch])

  if (loading) return <LoadingSpinner />

  if (!data) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <p className="text-muted">Reports could not be loaded.</p>
      </div>
    )
  }

  const { productReport, salesReport, canViewSalesReport } = data

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Review business performance, sales activity, and stock health</p>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: 4, background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
          {canViewSalesReport && (
            <button
              className={`btn ${activeTab === 'sales' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('sales')}
            >
              <HiOutlineChartBar /> Sales Report
            </button>
          )}
          <button
            className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('products')}
          >
            <HiOutlineCube /> Products Report
          </button>
        </div>
      </div>

      {activeTab === 'sales' && canViewSalesReport && salesReport && (
        <>
          <div className="stats-grid">
            <div className="vibrant-card primary">
              <div className="vibrant-label">Total Revenue</div>
              <div className="vibrant-value">{formatKES(salesReport.totalRevenue)}</div>
              <div className="icon-bg"><HiOutlineCash /></div>
            </div>
            <div className="vibrant-card info">
              <div className="vibrant-label">Completed Sales</div>
              <div className="vibrant-value">{salesReport.totalSales}</div>
              <div className="icon-bg"><HiOutlineShoppingBag /></div>
            </div>
            <div className="vibrant-card success">
              <div className="vibrant-label">Items Sold</div>
              <div className="vibrant-value">{salesReport.totalItemsSold}</div>
              <div className="icon-bg"><HiOutlineTrendingUp /></div>
            </div>
            <div className="vibrant-card warning">
              <div className="vibrant-label">Average Sale</div>
              <div className="vibrant-value">{formatKES(salesReport.averageSaleValue)}</div>
              <div className="icon-bg"><HiOutlineChartBar /></div>
            </div>
          </div>

          <div className="grid-2" style={{ alignItems: 'start' }}>
            <div className="list-card">
              <div className="list-card-title">
                <HiOutlineChartBar style={{ color: 'var(--primary)' }} />
                Last 30 Days
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {salesReport.dailySales.slice(-10).map(day => (
                  <div key={day.date} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px', gap: 12, alignItems: 'center' }}>
                    <span className="text-sm text-muted">{formatDate(day.date)}</span>
                    <div style={{ height: 10, background: 'var(--gray-100)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, salesReport.totalRevenue > 0 ? (day.total / salesReport.totalRevenue) * 100 * 5 : 0)}%`,
                          background: 'var(--primary)',
                        }}
                      />
                    </div>
                    <span className="font-semibold text-sm" style={{ textAlign: 'right' }}>{formatKES(day.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="list-card">
              <div className="list-card-title">
                <HiOutlineShoppingBag style={{ color: 'var(--success)' }} />
                Recent Sales
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {salesReport.recentSales.map(sale => (
                  <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <div>
                      <div className="font-semibold">{sale.receiptNumber}</div>
                      <div className="text-muted text-sm">{formatDate(sale.createdAt)} - {sale.itemCount} items</div>
                    </div>
                    <div className="font-semibold" style={{ color: 'var(--primary)' }}>{formatKES(sale.total)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'products' && (
        <>
          <div className="stats-grid">
            <div className="vibrant-card primary">
              <div className="vibrant-label">Inventory Value</div>
              <div className="vibrant-value">{formatKES(productReport.totalInventoryValue)}</div>
              <div className="icon-bg"><HiOutlineCash /></div>
            </div>
            <div className="vibrant-card info">
              <div className="vibrant-label">Products</div>
              <div className="vibrant-value">{productReport.totalProducts}</div>
              <div className="icon-bg"><HiOutlineCube /></div>
            </div>
            <div className="vibrant-card success">
              <div className="vibrant-label">Categories</div>
              <div className="vibrant-value">{productReport.categoryCount}</div>
              <div className="icon-bg"><HiOutlineChartBar /></div>
            </div>
            <div className="vibrant-card warning">
              <div className="vibrant-label">Stock Alerts</div>
              <div className="vibrant-value">{productReport.lowStockCount + productReport.outOfStockCount}</div>
              <div className="icon-bg"><HiOutlineExclamationCircle /></div>
            </div>
          </div>

          <div className="grid-2" style={{ alignItems: 'start', marginBottom: 24 }}>
            <div className="list-card">
              <div className="list-card-title">
                <HiOutlineCube style={{ color: 'var(--primary)' }} />
                Category Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {productReport.categoryDistribution.map(category => (
                  <div key={category.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <span className="font-semibold">{category.category}</span>
                    <span className="badge badge-admin">{category.count} products</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="list-card">
              <div className="list-card-title">
                <HiOutlineExclamationCircle style={{ color: 'var(--warning)' }} />
                Stock Summary
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ padding: 20, background: 'var(--warning-light)', borderRadius: 'var(--radius-md)' }}>
                  <div className="text-sm" style={{ color: 'var(--warning)', fontWeight: 700 }}>Low Stock</div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{productReport.lowStockCount}</div>
                </div>
                <div style={{ padding: 20, background: 'var(--danger-light)', borderRadius: 'var(--radius-md)' }}>
                  <div className="text-sm" style={{ color: 'var(--danger)', fontWeight: 700 }}>Out of Stock</div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{productReport.outOfStockCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Product Report</h2>
              <div style={{ width: 280 }}>
                <input
                  className="form-control"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={event => setProductSearch(event.target.value)}
                />
              </div>
            </div>
            <div className="card-body" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--gray-500)', fontSize: 12, textTransform: 'uppercase' }}>
                    <th style={{ padding: '0 12px 12px' }}>Product</th>
                    <th style={{ padding: '0 12px 12px' }}>Category</th>
                    <th style={{ padding: '0 12px 12px' }}>Supplier</th>
                    <th style={{ padding: '0 12px 12px' }}>Stock</th>
                    <th style={{ padding: '0 12px 12px' }}>Sold</th>
                    <th style={{ padding: '0 12px 12px' }}>Value</th>
                    <th style={{ padding: '0 12px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id} style={{ borderTop: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: 12 }}>
                        <div className="font-semibold">{product.name}</div>
                        <div className="text-sm text-muted">{formatKES(product.price)} each</div>
                      </td>
                      <td style={{ padding: 12 }}>{product.category}</td>
                      <td style={{ padding: 12 }}>{product.supplierName || 'Unassigned'}</td>
                      <td style={{ padding: 12 }}>{product.stock} units</td>
                      <td style={{ padding: 12 }}>{product.totalSold} units</td>
                      <td style={{ padding: 12 }} className="font-semibold">{formatKES(product.inventoryValue)}</td>
                      <td style={{ padding: 12 }}>
                        <span className={`badge ${getStatusBadgeClass(product)}`}>{product.stockStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <p className="text-muted" style={{ textAlign: 'center', padding: 32 }}>No products match your search.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
