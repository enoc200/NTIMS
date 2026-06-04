'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HiOutlineExclamationCircle, HiOutlineX } from 'react-icons/hi'

interface Props {
  lowStockCount: number
  outOfStockCount: number
}

export default function AlertBanner({ lowStockCount, outOfStockCount }: Props) {
  const router = useRouter()
  const [visible, setVisible] = useState(true)
  const total = lowStockCount + outOfStockCount
  if (!visible || total === 0) return null

  return (
    <div className="alert-banner">
      <div className="alert-banner-content">
        <HiOutlineExclamationCircle style={{ fontSize: '24px' }} />
        <div>
          <div style={{ fontWeight: '700', fontSize: '14px' }}>Inventory Alert: {total} Items Need Attention</div>
          <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: 500 }}>
            {outOfStockCount > 0 && `${outOfStockCount} critical out of stock`}
            {outOfStockCount > 0 && lowStockCount > 0 && ' | '}
            {lowStockCount > 0 && `${lowStockCount} items reaching low stock threshold`}
          </div>
        </div>
      </div>
      <div className="alert-banner-actions">
        <button className="btn btn-sm btn-alert" style={{ fontWeight: 700 }} onClick={() => router.push('/dashboard/products')}>
          Restock Now
        </button>
        <button className="btn-close" onClick={() => setVisible(false)}>
          <HiOutlineX />
        </button>
      </div>
    </div>
  )
}
