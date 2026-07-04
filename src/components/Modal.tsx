'use client'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

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
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modal = (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={e => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="modal" style={{ maxWidth }}>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button type="button" className="btn-icon modal-close" onClick={onClose} aria-label="Close modal">
              ✕
            </button>
          </div>
        )}
        <div className="modal-content">{children}</div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
