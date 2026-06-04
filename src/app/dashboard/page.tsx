'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatKES } from '@/lib/utils'
import { 
  HiOutlineTrendingUp, 
  HiOutlineCube, 
  HiOutlineCash, 
  HiOutlineExclamationCircle, 
  HiOutlineShoppingBag,
  HiOutlineClock
} from 'react-icons/hi'
import type { DashboardData } from '@/types'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const role = session?.user?.role

  function fetchDashboard() {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 30000) // Auto-update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) return <LoadingSpinner />
  if (!data) return <div className="page-content"><p>Failed to load dashboard.</p></div>

  const { stats, fastMoving, recentSales, lowStockItems } = data

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--dark)', letterSpacing: '-1px' }}>
          Welcome Back, {session?.user?.name}! 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 500 }}>
          Here's a quick look at your business performance today.
        </p>
      </div>

      {/* Colorful Stats Grid */}
      <div className="stats-grid">
        <div className="vibrant-card primary">
          <div className="vibrant-label">Today's Revenue</div>
          <div className="vibrant-value">{formatKES(stats.todaysSales)}</div>
          <div className="icon-bg"><HiOutlineCash /></div>
        </div>

        <div className="vibrant-card info">
          <div className="vibrant-label">Total Products</div>
          <div className="vibrant-value">{stats.totalProducts} Items</div>
          <div className="icon-bg"><HiOutlineCube /></div>
        </div>

        <div className="vibrant-card success">
          <div className="vibrant-label">Stock Value</div>
          <div className="vibrant-value">{formatKES(stats.inventoryValue)}</div>
          <div className="icon-bg"><HiOutlineTrendingUp /></div>
        </div>

        <div className="vibrant-card warning">
          <div className="vibrant-label">Stock Alerts</div>
          <div className="vibrant-value">{stats.lowStockCount} Critical</div>
          <div className="icon-bg"><HiOutlineExclamationCircle /></div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 32, marginBottom: 40 }}>
        {/* Recent Activity with Color */}
        <div className="list-card">
          <div className="list-card-title">
            <HiOutlineClock style={{ color: 'var(--primary)' }} />
            Recent Sales
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {recentSales.map((sale, i) => (
              <div key={sale.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: '16px', background: i === 0 ? 'var(--primary-light)' : '#f8fafc', border: i === 0 ? '1px solid #e0e7ff' : 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--primary)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <HiOutlineShoppingBag />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{sale.receiptNumber}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>{sale.itemCount} items sold</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)' }}>
                  {formatKES(sale.total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="list-card">
          <div className="list-card-title">
            <HiOutlineTrendingUp style={{ color: 'var(--success)' }} />
            Hot Selling Items
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fastMoving.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: i === 0 ? '#dcfce7' : '#f1f5f9', color: i === 0 ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.category}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--dark)' }}>{item.totalSold} sold</div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Stock: {item.stock}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="list-card" style={{ background: 'var(--gradient-secondary)', color: 'white' }}>
          <div className="list-card-title" style={{ color: 'white' }}>
            <HiOutlineExclamationCircle />
            Critical Stock Warning
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {lowStockItems.slice(0, 4).map(item => (
              <div key={item.id} style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', flex: 1, minWidth: '200px' }}>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{item.name}</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Only {item.stock} units remaining</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
