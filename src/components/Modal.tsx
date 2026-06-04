'use client'
import { useEffect, useRef } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: number
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 480 }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll lock removed as per user request
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose() }}>
      <div className="modal" style={{ maxWidth }}>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="btn-icon" onClick={onClose} style={{ fontSize: '18px' }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
