'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getRoleLabel } from '@/lib/utils'
import type { Role } from '@/types'

const TABS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'D', roles: ['ADMIN', 'STORE_MANAGER', 'SALES_ATTENDANT'] },
  { href: '/dashboard/products', label: 'Products', icon: 'P', roles: ['ADMIN', 'STORE_MANAGER'] },
  { href: '/dashboard/suppliers', label: 'Suppliers', icon: 'S', roles: ['ADMIN', 'STORE_MANAGER'] },
  { href: '/dashboard/sales', label: 'Sales', icon: 'S', roles: ['SALES_ATTENDANT'] },
  { href: '/dashboard/reports', label: 'Reports', icon: 'R', roles: ['ADMIN', 'STORE_MANAGER'] },
  { href: '/dashboard/users', label: 'Users', icon: 'U', roles: ['ADMIN'] },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = session?.user?.role as Role

  const visibleTabs = TABS.filter(t => t.roles.includes(role))

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-brand-title">SME Inventory System</span>
        <span className="navbar-brand-sub">Smart inventory management for your business</span>
      </div>
      <div className="navbar-tabs">
        {visibleTabs.map(tab => (
          <Link key={tab.href} href={tab.href} className={`nav-tab ${isActive(tab.href) ? 'active' : ''}`}>
            <span>{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="navbar-user">
        {session?.user && (
          <>
            <div className="user-info">
              <div className="user-name">{session.user.name}</div>
              <div className="user-role">{getRoleLabel(role)}</div>
            </div>
            <button className="logout-btn" onClick={() => signOut({ callbackUrl: '/' })} title="Sign out">
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
