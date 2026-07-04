'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { HiOutlineHome, HiOutlineCube, HiOutlineShoppingCart, HiOutlineUsers, HiOutlineLogout, HiOutlineChartBar, HiOutlineTruck } from 'react-icons/hi'
import type { Role } from '@/types'

const MENU_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: HiOutlineHome, roles: ['ADMIN', 'STORE_MANAGER', 'SALES_ATTENDANT'] },
  { href: '/dashboard/products', label: 'Products', icon: HiOutlineCube, roles: ['ADMIN', 'STORE_MANAGER'] },
  { href: '/dashboard/suppliers', label: 'Suppliers', icon: HiOutlineTruck, roles: ['ADMIN', 'STORE_MANAGER'] },
  { href: '/dashboard/sales', label: 'Point of Sale', icon: HiOutlineShoppingCart, roles: ['SALES_ATTENDANT'] },
  { href: '/dashboard/reports', label: 'Reports', icon: HiOutlineChartBar, roles: ['ADMIN', 'STORE_MANAGER'] },
  { href: '/dashboard/users', label: 'Team', icon: HiOutlineUsers, roles: ['ADMIN'] },
]

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = session?.user?.role as Role

  const visibleItems = MENU_ITEMS.filter(item => item.roles.includes(role))

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  async function handleSignOut() {
    await signOut({ redirect: false })
    window.location.assign('/')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon" style={{ background: 'var(--gradient-primary)', borderRadius: '12px', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)' }}>🛒</div>
          <div className="logo-text">
            <span className="logo-main">NTIMS</span>
            <span className="logo-sub">Smart Inventory Management</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-title">Main Menu</span>
          {visibleItems.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
              >
                <Icon className="link-icon" />
                <span className="link-label">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="user-avatar" style={{ background: 'var(--gradient-primary)', color: 'white', border: 'none' }}>
            {session?.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{session?.user?.name}</span>
            <span className="user-role">{role?.replace('_', ' ')}</span>
          </div>
        </div>
        <button type="button" className="btn-logout" onClick={handleSignOut}>
          <HiOutlineLogout />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
