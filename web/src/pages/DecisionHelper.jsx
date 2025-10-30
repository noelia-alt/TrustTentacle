import { useState } from 'react'

export default function DecisionHelper() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const verifyUrl = async () => {
    setError('')
    setResult(null)
    if (!url) { setError('Please enter a URL'); return }
    try {
      setLoading(true)
      const res = await fetch('http://localhost:3001/api/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError('Verification request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', color: 'white', background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)', minHeight: '100%' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Decision Helper</h1>
        <p style={{ color: '#d1d5db', marginBottom: '1rem' }}>Check if a site looks safe before interacting.</p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #374151', background: 'rgba(255,255,255,0.1)', color: 'white' }}
          />
          <button onClick={verifyUrl} disabled={loading} style={{ background: '#8b5cf6', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Checking...' : 'Verify'}
          </button>
        </div>
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}

        {result && (
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Verdict: {result.verdict || 'UNKNOWN'}</div>
            <div style={{ color: '#d1d5db', marginBottom: '0.5rem' }}>Domain: {result.domain}</div>
            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Recommendations</div>
                <ul>
                  {result.recommendations.map((r, idx) => (
                    <li key={idx} style={{ color: '#d1d5db' }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

