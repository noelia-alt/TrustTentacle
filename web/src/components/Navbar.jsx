import { THEME } from '../theme';

export default function Navbar({ onNavigate, currentPage }) {
  const itemStyle = (page) => ({
    color: currentPage === page ? THEME.text : THEME.textMuted,
    background: currentPage === page ? 'rgba(34, 211, 238, 0.14)' : 'transparent',
    border: currentPage === page ? `1px solid ${THEME.panelBorder}` : '1px solid transparent',
    borderRadius: '999px',
    padding: '0.55rem 0.9rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer'
  });

  return (
    <nav
      style={{
        background: 'rgba(4, 14, 25, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${THEME.panelBorder}`,
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '72px', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.4rem 0'
            }}
          >
            <img src="/favicon.png" alt="TrustTentacle" style={{ width: '46px', height: '46px' }} />
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ fontSize: '1.12rem', fontWeight: 'bold', color: THEME.text, margin: 0 }}>TrustTentacle</h1>
              <p style={{ fontSize: '0.75rem', color: THEME.accent, margin: 0 }}>Stage 2 anti-phishing MVP</p>
            </div>
          </button>

          <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('dashboard')} style={itemStyle('dashboard')}>
              Dashboard
            </button>
            <button onClick={() => onNavigate('helper')} style={itemStyle('helper')}>
              Decision Helper
            </button>
            <button onClick={() => onNavigate('map')} style={itemStyle('map')}>
              Threat Map
            </button>
            <button
              onClick={() => onNavigate('home')}
              style={{
                background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentStrong})`,
                color: '#04111d',
                padding: '0.6rem 1rem',
                borderRadius: '999px',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {currentPage === 'simulator' ? 'Back to MVP' : 'Home'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
