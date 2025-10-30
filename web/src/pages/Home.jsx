import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Home() {
  const [series, setSeries] = useState([
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
    // Prefer backend activity series; fallback to default demo data
    fetch(`http://localhost:3001/api/v1/stats/activity?days=${range}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (!data?.series) return
        const mapped = data.series.map(p => ({ day: p.date.slice(5), value: p.value }))
        setSeries(mapped)
      })
      .catch(() => {})
  }, [range])

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)',
      color: 'white',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <img src="/favicon.png" alt="TrustTentacle Octopus" style={{ width: '256px', height: '256px' }} />
        </div>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>TrustTentacle</h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Your Digital Guardian Octopus</p>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Intelligent protection against phishing and digital fraud combining AI, Blockchain and Community
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '3rem auto 0' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h2 style={{ margin: 0 }}>Protection Activity</h2>
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
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                <XAxis dataKey="day" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.9)', border: 'none', color: 'white' }} />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
