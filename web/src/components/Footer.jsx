export default function Footer() {
  return (
    <footer style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '3rem 1rem',
      marginTop: '5rem'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <img src="/favicon.png" alt="TrustTentacle" style={{ width: '48px', height: '48px' }} />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>TrustTentacle</h3>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Digital Guardian</p>
              </div>
            </div>
            <p style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: '1.5' }}>
              Your guardian octopus in the digital ocean. Intelligent protection against
              phishing and fraud combining AI, Blockchain and Community.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '1rem' }}>
              Octopus Hackathon 2025
            </p>
          </div>

          <div>
            <h4 style={{ color: 'white', fontWeight: 'bold', marginBottom: '1rem' }}>Product</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}>Chrome Extension</a>
              <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}>Dashboard</a>
              <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}>API</a>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', fontWeight: 'bold', marginBottom: '1rem' }}>Resources</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}>Documentation</a>
              <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}>GitHub</a>
              <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}>Support</a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
          <p style={{ margin: 0 }}>
            © 2025 TrustTentacle. Made with love for Octopus Hackathon 2025
          </p>
        </div>
      </div>
    </footer>
  )
}

