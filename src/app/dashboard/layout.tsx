'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import AlertBanner from '@/components/AlertBanner'
import NotificationCenter from '@/components/NotificationCenter'
import { HiOutlineSearch } from 'react-icons/hi'

import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [counts, setCounts] = useState({ lowStockCount: 0, outOfStockCount: 0 })

  const getPageTitle = () => {
    if (pathname.includes('/products')) return 'Products'
    if (pathname.includes('/suppliers')) return 'Suppliers'
    if (pathname.includes('/sales')) return 'Point of Sale'
    if (pathname.includes('/reports')) return 'Reports'
    if (pathname.includes('/users')) return 'Team Management'
    return 'Dashboard'
  }

  useEffect(() => {
    let active = true

    async function loadCounts() {
      try {
        const response = await fetch('/api/dashboard')
        const data = await response.json()
        if (active && data.stats) {
          setCounts({ lowStockCount: data.stats.lowStockCount, outOfStockCount: data.stats.outOfStockCount })
        }
      } catch {}
    }

    void loadCounts()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <div className="breadcrumb">
              <span className="breadcrumb-item">NEW TECH IMS</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-item active">{getPageTitle()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="search-bar" style={{ position: 'relative', width: '240px' }}>
              <HiOutlineSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Quick search..."
                style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
              />
            </div>
            <NotificationCenter />
          </div>
        </header>

        {/* Alert banner if needed */}
        <AlertBanner lowStockCount={counts.lowStockCount} outOfStockCount={counts.outOfStockCount} />

        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  )
}
