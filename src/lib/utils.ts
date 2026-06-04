import { type Role } from '@/types'

export function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-KE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case 'ADMIN': return 'Administrator'
    case 'STORE_MANAGER': return 'Store Manager'
    case 'SALES_ATTENDANT': return 'Sales Attendant'
  }
}

export function getRoleBadgeClass(role: Role): string {
  switch (role) {
    case 'ADMIN': return 'badge-admin'
    case 'STORE_MANAGER': return 'badge-manager'
    case 'SALES_ATTENDANT': return 'badge-attendant'
  }
}

export function getAvatarClass(role: Role): string {
  switch (role) {
    case 'ADMIN': return 'avatar-admin'
    case 'STORE_MANAGER': return 'avatar-manager'
    case 'SALES_ATTENDANT': return 'avatar-attendant'
  }
}

export function generateReceiptNumber(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0')
  return `RCP-${dateStr}-${rand}`
}

export function getLast7Days(): string[] {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
}
