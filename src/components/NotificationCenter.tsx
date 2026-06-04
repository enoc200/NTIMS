'use client'
import { useState, useEffect, useRef } from 'react'
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineInformationCircle } from 'react-icons/hi'
import { formatDateTime } from '@/lib/utils'
import type { Notification } from '@/types'

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) {
        setNotifications(data)
      }
    } catch (error) {}
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function markAsRead(id: number) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (error) {}
  }

  async function markAllAsRead() {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readAll: true })
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {}
  }

  function getIcon(type: string) {
    switch (type) {
      case 'LOW_STOCK': return <HiOutlineExclamation style={{ color: 'var(--warning)' }} />
      case 'SALE': return <HiOutlineCheckCircle style={{ color: 'var(--success)' }} />
      default: return <HiOutlineInformationCircle style={{ color: 'var(--primary)' }} />
    }
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        className="btn-icon" 
        style={{ fontSize: '24px', position: 'relative' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <HiOutlineBell />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', 
            top: '4px', 
            right: '4px', 
            width: '18px', 
            height: '18px', 
            background: 'var(--danger)', 
            color: 'white',
            borderRadius: '50%', 
            border: '2px solid white',
            fontSize: '10px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '12px',
          width: '360px',
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--gray-200)',
          zIndex: 100,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => !n.read && markAsRead(n.id)}
                  style={{ 
                    padding: '16px 20px', 
                    borderBottom: '1px solid var(--gray-50)', 
                    cursor: n.read ? 'default' : 'pointer',
                    background: n.read ? 'white' : 'var(--primary-light)',
                    display: 'flex',
                    gap: 12
                  }}
                >
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '10px', 
                    background: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0
                  }}>
                    {getIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: 4 }}>{n.message}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{formatDateTime(n.createdAt)}</div>
                  </div>
                  {!n.read && (
                    <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', marginTop: 6 }}></div>
                  )}
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '12px', textAlign: 'center', background: 'var(--gray-50)' }}>
            <button className="btn btn-outline" style={{ width: '100%', fontSize: '12px' }}>View All Activity</button>
          </div>
        </div>
      )}
    </div>
  )
}
