import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const stats = [
    { label: 'Sites Verified', value: '10,234', icon: 'SV', change: '+12%' },
    { label: 'Threats Blocked', value: '2,547', icon: 'TB', change: '+8%' },
    { label: 'Users Protected', value: '5,123', icon: 'UP', change: '+15%' },
    { label: 'Community Reports', value: '3,289', icon: 'CR', change: '+5%' }
  ]

  const recentThreats = [
    { url: 'paypa1-secure.tk', risk: 'High', detected: '2 min ago', type: 'Typosquatting' },
    { url: 'g00gle-verify.ml', risk: 'High', detected: '5 min ago', type: 'Brand Impersonation' },
    { url: 'amaz0n-login.ga', risk: 'Critical', detected: '8 min ago', type: 'Credential Theft' },
    { url: 'secure-bank.cf', risk: 'Medium', detected: '12 min ago', type: 'Suspicious Keywords' }
  ]

  const tentacles = [
    { name: 'Blockchain Registry', status: 'Active', checks: '1,234' },
    { name: 'Community Reports', status: 'Active', checks: '892' },
    { name: 'Threat Intelligence', status: 'Active', checks: '2,341' },
    { name: 'AI Detection', status: 'Active', checks: '3,456' },
    { name: 'SSL Analysis', status: 'Active', checks: '1,567' },
    { name: 'Domain Verification', status: 'Active', checks: '2,123' },
    { name: 'Similarity Analysis', status: 'Active', checks: '987' },
    { name: 'Reputation System', status: 'Active', checks: '1,789' }
  ]

  // Activity series for the chart
  const [activitySeries, setActivitySeries] = useState([
    { day: 'Mon', value: 180 },
    { day: 'Tue', value: 210 },
    { day: 'Wed', value: 190 },
    { day: 'Thu', value: 230 },
    { day: 'Fri', value: 260 },
    { day: 'Sat', value: 240 },
    { day: 'Sun', value: 243 }
  ])
  const [range, setRange] = useState(7)

  useEffect(() => {
    fetch(`http://localhost:3001/api/v1/stats/activity?days=${range}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => {
        if (!data?.series) return
        const mapped = data.series.map(p => ({ day: p.date.slice(5), value: p.value }))
        setActivitySeries(mapped)
      }).catch(() => {})
  }, [range])

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)',
      color: 'white',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Protection Dashboard
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#d1d5db' }}>
            Real-time statistics from your guardian octopus
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {stats.map((stat, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.3s'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#a78bfa', marginBottom: '0.25rem' }}>
                {stat.value}
              </div>
              <div style={{ color: '#d1d5db', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                {stat.label}
              </div>
              <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {stat.change} this week
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Recent Threats
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentThreats.map((threat, index) => (
                <div key={index} style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${threat.risk === 'Critical' ? '#ef4444' : threat.risk === 'High' ? '#f59e0b' : '#eab308'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                      {threat.url}
                    </div>
                    <div style={{ 
                      background: threat.risk === 'Critical' ? '#ef4444' : threat.risk === 'High' ? '#f59e0b' : '#eab308',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}>
                      {threat.risk}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {threat.type} - {threat.detected}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              8 Tentacles Status
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tentacles.map((tentacle, index) => (
                <div key={index} style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                      {tentacle.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {tentacle.checks} checks
                    </div>
                  </div>
                  <div style={{
                    background: '#10b981',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {tentacle.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              Protection Activity (Last {range} days)
            </h2>
            <div>
              {[7,14,30].map(d => (
                <button key={d} onClick={() => setRange(d)} style={{
                  background: range === d ? '#8b5cf6' : 'transparent',
                  color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                  padding: '0.25rem 0.6rem', borderRadius: '6px', marginLeft: '0.4rem', cursor: 'pointer'
                }}>{d}d</button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={activitySeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashColorA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                <XAxis dataKey="day" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.9)', border: 'none', color: 'white' }} />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#dashColorA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
