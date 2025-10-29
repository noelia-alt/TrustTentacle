export default function Home() {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)',
      color: 'white',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <img 
            src="/favicon.png" 
            alt="TrustTentacle Octopus" 
            style={{ width: '256px', height: '256px' }}
          />
        </div>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          TrustTentacle
        </h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
          Your Digital Guardian Octopus
        </p>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Intelligent protection against phishing and digital fraud combining AI, Blockchain and Community
        </p>
      </div>
    </div>
  )
}
