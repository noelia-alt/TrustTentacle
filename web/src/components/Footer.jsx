export default function Footer() {
  return (
    <footer style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '2rem 1rem',
      marginTop: '3rem'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', color: '#d1d5db' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <img src="/favicon.png" alt="TrustTentacle" style={{ width: '36px', height: '36px' }} />
            <div>
              <div style={{ color: 'white', fontWeight: 700 }}>TrustTentacle</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Stage 2 MVP</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.9rem' }}>
            <a href="https://github.com/noelia-alt/TrustTentacle" target="_blank" rel="noreferrer" style={{ color: '#c4b5fd' }}>
              GitHub
            </a>
            <span style={{ opacity: 0.7 }}>Octopus Hackathon 2025</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
