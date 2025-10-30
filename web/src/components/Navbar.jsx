export default function Navbar({ onNavigate }) {
  return (
    <nav style={{ 
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          {/* Logo */}
          <button 
            onClick={() => onNavigate('home')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <img 
              src="/favicon.png" 
              alt="TrustTentacle" 
              style={{ width: '48px', height: '48px' }}
            />
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>TrustTentacle</h1>
              <p style={{ fontSize: '0.75rem', color: '#a78bfa', margin: 0 }}>Digital Guardian</p>
            </div>
          </button>

          {/* Navigation Links */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={() => onNavigate('dashboard')}
              style={{ 
                color: '#d1d5db', 
                background: 'none',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Dashboard
            </button>
            <button 
              onClick={() => onNavigate('map')}
              style={{ 
                color: '#d1d5db', 
                background: 'none',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Map
            </button>
            <button 
              onClick={() => onNavigate('helper')}
              style={{ 
                color: '#d1d5db', 
                background: 'none',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Assistant
            </button>
            <button 
              onClick={() => onNavigate('simulator')}
              style={{ 
                color: '#d1d5db', 
                background: 'none',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Simulator
            </button>
            <button 
              onClick={() => onNavigate('home')}
              style={{ 
                background: '#8b5cf6', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

