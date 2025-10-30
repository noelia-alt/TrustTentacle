import { useState, useEffect, useRef } from 'react'

export default function ThreatMap() {
  const [threats, setThreats] = useState([])
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    topCountry: 'Argentina'
  })
  const [isMobile, setIsMobile] = useState(false)

  const mapRef = useRef(null)
  const markersRef = useRef(null)

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/v1/threats/recent')
        const data = await response.json()
        if (data.success) {
          setThreats(data.threats)
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Error fetching threats:', error)
        loadDemoData()
      }
    }

    const loadDemoData = () => {
      const initialThreats = [
        { id: 1, country: 'Argentina', city: 'Buenos Aires', lat: -34.6037, lng: -58.3816, type: 'Typosquatting', severity: 'high', time: '2 min ago' },
        { id: 2, country: 'Brasil', city: 'São Paulo', lat: -23.5505, lng: -46.6333, type: 'CEO Fraud', severity: 'critical', time: '5 min ago' },
        { id: 3, country: 'México', city: 'Ciudad de México', lat: 19.4326, lng: -99.1332, type: 'Phishing Email', severity: 'medium', time: '8 min ago' },
        { id: 4, country: 'Chile', city: 'Santiago', lat: -33.4489, lng: -70.6693, type: 'Smishing', severity: 'high', time: '12 min ago' },
        { id: 5, country: 'Colombia', city: 'Bogotá', lat: 4.7110, lng: -74.0721, type: 'Brand Impersonation', severity: 'high', time: '15 min ago' },
        { id: 6, country: 'España', city: 'Madrid', lat: 40.4168, lng: -3.7038, type: 'Credential Theft', severity: 'critical', time: '18 min ago' },
        { id: 7, country: 'Perú', city: 'Lima', lat: -12.0464, lng: -77.0428, type: 'Phishing Email', severity: 'medium', time: '22 min ago' },
        { id: 8, country: 'Uruguay', city: 'Montevideo', lat: -34.9011, lng: -56.1645, type: 'Typosquatting', severity: 'high', time: '25 min ago' }
      ]
      setThreats(initialThreats)
      setStats({ today: 243, thisWeek: 1547, thisMonth: 6892, topCountry: 'Argentina' })
    }

    fetchThreats()
    const interval = setInterval(fetchThreats, 10000)
    return () => clearInterval(interval)
  }, [])

  // Track viewport to adapt legend layout/position
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Initialize Leaflet map when available and update markers on data change
  useEffect(() => {
    const L = window.L
    if (!L) return

    if (!mapRef.current) {
      const map = L.map('threat-map', { zoomControl: false, worldCopyJump: true })
      map.setView([0, 0], 2)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 5,
        minZoom: 1
      }).addTo(map)

      markersRef.current = L.layerGroup().addTo(map)
      mapRef.current = map
    }

    // Update markers
    if (markersRef.current) {
      markersRef.current.clearLayers()
      threats.slice(0, 50).forEach(t => {
        if (typeof t.lat !== 'number' || typeof t.lng !== 'number') return
        const color = t.severity === 'critical' ? 'red' : t.severity === 'high' ? 'orange' : '#eab308'
        const marker = window.L.circleMarker([t.lat, t.lng], {
          radius: 6,
          color,
          weight: 2,
          fillOpacity: 0.7
        }).bindTooltip(`${t.city}, ${t.country} - ${t.type}`)
        markersRef.current.addLayer(marker)
      })
    }
  }, [threats])

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return '#ef4444'
      case 'high': return '#f59e0b'
      case 'medium': return '#eab308'
      default: return '#10b981'
    }
  }

  const getSeverityLabel = (severity) => {
    switch(severity) {
      case 'critical': return 'Critical'
      case 'high': return 'High'
      case 'medium': return 'Medium'
      default: return 'Low'
    }
  }

  const typeIcons = {
    'Typosquatting': 'TS',
    'CEO Fraud': 'CF',
    'Phishing Email': 'PE',
    'Smishing': 'SM',
    'Brand Impersonation': 'BI',
    'Credential Theft': 'CT'
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)', color: 'white', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>TT</div>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Global Threat Map</h1>
          <p style={{ fontSize: '1.25rem', color: '#d1d5db' }}>Real-time detections from the TrustTentacle community</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '1.5rem', border: '2px solid #ef4444', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '0.5rem' }}>{stats.today}</div>
            <div style={{ color: '#fecaca' }}>Detections today</div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '1.5rem', border: '2px solid #f59e0b', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>{stats.thisWeek}</div>
            <div style={{ color: '#fde68a' }}>This week</div>
          </div>
          <div style={{ background: 'rgba(234, 179, 8, 0.15)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '1.5rem', border: '2px solid #eab308', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#eab308', marginBottom: '0.5rem' }}>{stats.thisMonth}</div>
            <div style={{ color: '#fef08a' }}>This month</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '1.5rem', border: '2px solid #10b981', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>{stats.topCountry}</div>
            <div style={{ color: '#a7f3d0' }}>Top country</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.2)', position: 'relative', minHeight: '500px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Detection Map</h2>
            <div id="threat-map" style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden' }} />
            {/* Legend: severity box with improved aesthetics and responsive layout */}
            <div style={{
              position: 'absolute',
              ...(isMobile ? { top: '0.75rem', left: '0.75rem' } : { bottom: '1rem', right: '1rem' }),
              zIndex: 999,
              background: 'rgba(17, 24, 39, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              padding: isMobile ? '0.5rem 0.6rem' : '0.75rem 0.9rem',
              borderRadius: '12px',
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              color: '#e5e7eb',
              backdropFilter: 'blur(6px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, letterSpacing: '0.02em' }}>Severity</span>
                <span style={{ display: 'inline-block', height: '6px', width: '60px', borderRadius: '999px', background: 'linear-gradient(90deg, #ef4444, #f59e0b, #eab308)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? '0.75rem' : '0.35rem' }}>
                {[
                  { label: 'Critical', color: '#ef4444' },
                  { label: 'High', color: '#f59e0b' },
                  { label: 'Medium', color: '#eab308' }
                ].map(({ label, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, boxShadow: `0 0 0 2px rgba(255,255,255,0.1), 0 0 0 4px ${color}22` }} />
                    <span style={{ fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.2)', maxHeight: '580px', overflow: 'hidden' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Live Feed</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {threats.map((threat) => (
                <div key={threat.id} style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem', borderRadius: '8px', borderLeft: `4px solid ${getSeverityColor(threat.severity)}`, animation: threat.time === 'Now' ? 'slideIn 0.5s ease-out' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{typeIcons[threat.type] || 'TH'}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{threat.city}, {threat.country}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{threat.type}</div>
                      </div>
                    </div>
                    <div style={{ background: getSeverityColor(threat.severity), padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{getSeverityLabel(threat.severity)}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>• {threat.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(139, 92, 246, 0.2)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '2rem', border: '1px solid #8b5cf6', marginTop: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Community Protection in Action</h2>
          <p style={{ color: '#d1d5db', marginBottom: '1.5rem', lineHeight: '1.6' }}>Every detection you see here was reported by a TrustTentacle user. Together we form a global protection network that learns and strengthens with each identified threat.</p>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>5,123</div><div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>Active Users</div></div>
            <div><div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>42</div><div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>Countries</div></div>
            <div><div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>98.7%</div><div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>Accuracy</div></div>
          </div>
        </div>

        <style>{`
          @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `}</style>
      </div>
    </div>
  )
}
