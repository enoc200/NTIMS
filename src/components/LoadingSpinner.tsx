'use client'

export default function LoadingSpinner() {
  return (
    <div className="loading-wrapper" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
      <p style={{ color: 'var(--gray-500)', fontWeight: 500, fontSize: '14px' }}>Loading data...</p>
    </div>
  )
}
