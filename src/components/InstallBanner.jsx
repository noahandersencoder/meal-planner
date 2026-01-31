import { useState, useEffect } from 'react'

function InstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const isStandalone = window.navigator.standalone === true
    const dismissed = localStorage.getItem('install-banner-dismissed')

    if (isIOS && !isStandalone && !dismissed) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  function dismiss() {
    localStorage.setItem('install-banner-dismissed', '1')
    setShow(false)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#065f46',
      color: '#fff',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      zIndex: 9999,
      fontSize: '14px',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
    }}>
      <span>
        Install this app: tap{' '}
        <strong>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            strokeLinejoin="round" style={{ verticalAlign: '-2px' }}>
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>{' '}
          Share
        </strong>{' '}
        then <strong>"Add to Home Screen"</strong>
      </span>
      <button
        onClick={dismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '0 4px',
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-label="Dismiss install banner"
      >
        &times;
      </button>
    </div>
  )
}

export default InstallBanner
