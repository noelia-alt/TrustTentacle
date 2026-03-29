import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../config';
import { THEME, getRiskStyle } from '../theme';

const fallbackSeries = [
  { day: 'Mon', value: 180 },
  { day: 'Tue', value: 210 },
  { day: 'Wed', value: 190 },
  { day: 'Thu', value: 230 },
  { day: 'Fri', value: 260 },
  { day: 'Sat', value: 240 },
  { day: 'Sun', value: 243 }
];

export default function Home({ onNavigate }) {
  const [series, setSeries] = useState(fallbackSeries);
  const [range, setRange] = useState(7);
  const [summary, setSummary] = useState({
    urlsChecked: 0,
    threatsBlocked: 0,
    reportsSubmitted: 0
  });
  const [quickUrl, setQuickUrl] = useState('https://devpost.com/');
  const [quickResult, setQuickResult] = useState(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/stats/activity?days=${range}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!data?.series) return;
        setSeries(data.series.map((point) => ({ day: point.date.slice(5), value: point.value })));
      })
      .catch(() => {});
  }, [range]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!data?.protection) return;
        setSummary(data.protection);
      })
      .catch(() => {});
  }, []);

  const runQuickCheck = async () => {
    setQuickError('');
    setQuickResult(null);

    if (!quickUrl.trim()) {
      setQuickError('Enter a URL to verify.');
      return;
    }

    try {
      setQuickLoading(true);
      const response = await fetch(`${API_BASE_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: quickUrl.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Verification failed');
      }
      setQuickResult(data);
    } catch (error) {
      setQuickError(error.message || 'Verification failed');
    } finally {
      setQuickLoading(false);
    }
  };

  const verdictStyle = getRiskStyle(quickResult?.verdict);

  const statCards = [
    { label: 'Sites verified', value: summary.urlsChecked || 0, tone: THEME.accent },
    { label: 'Threats blocked', value: summary.threatsBlocked || 0, tone: THEME.dangerous },
    { label: 'Reports submitted', value: summary.reportsSubmitted || 0, tone: THEME.suspicious }
  ];

  const navButton = (label, target, primary = false) => (
    <button
      key={label}
      onClick={() => onNavigate?.(target)}
      style={{
        background: primary ? `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentStrong})` : 'transparent',
        color: THEME.text,
        border: primary ? 'none' : `1px solid ${THEME.panelBorder}`,
        borderRadius: '999px',
        padding: '0.85rem 1.2rem',
        fontSize: '0.95rem',
        fontWeight: 700,
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        background: THEME.bg,
        color: THEME.text,
        minHeight: '100vh',
        padding: '2rem'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            alignItems: 'stretch',
            marginBottom: '2rem'
          }}
        >
          <div
            style={{
              background: THEME.panel,
              border: `1px solid ${THEME.panelBorder}`,
              borderRadius: '24px',
              padding: '2rem',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.35)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-80px',
                right: '-60px',
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(34, 211, 238, 0.22) 0%, rgba(34, 211, 238, 0) 70%)'
              }}
            />
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '999px',
                background: THEME.accentSoft,
                border: `1px solid ${THEME.panelBorder}`,
                color: THEME.accent,
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '1.2rem'
              }}
            >
              Stage 2 MVP
            </div>
            <h1 style={{ fontSize: '3.4rem', lineHeight: 1.02, margin: '0 0 1rem 0' }}>
              Real-time anti-phishing protection for everyday browsing.
            </h1>
            <p style={{ color: THEME.textMuted, fontSize: '1.08rem', lineHeight: 1.65, marginBottom: '1.4rem' }}>
              TrustTentacle combines heuristic analysis, verified domain intelligence and community reporting into a
              single browser-first protection layer.
            </p>
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.4rem' }}>
              {navButton('Open Dashboard', 'dashboard', true)}
              {navButton('Decision Helper', 'helper')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem' }}>
              {[
                { title: 'Extension', text: 'Instant browser-side checks and reporting.' },
                { title: 'API Engine', text: 'Risk decisioning with graceful demo fallback.' },
                { title: 'Training Lab', text: 'Secondary phishing awareness module.' }
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    background: THEME.panelStrong,
                    border: `1px solid ${THEME.panelBorder}`,
                    borderRadius: '16px',
                    padding: '1rem'
                  }}
                >
                  <div style={{ color: THEME.accent, fontWeight: 700, marginBottom: '0.35rem' }}>{item.title}</div>
                  <div style={{ color: THEME.textMuted, fontSize: '0.92rem', lineHeight: 1.5 }}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: THEME.panel,
              border: `1px solid ${THEME.panelBorder}`,
              borderRadius: '24px',
              padding: '2rem',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.35)'
            }}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: THEME.accent, fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Quick Check
              </div>
              <h2 style={{ margin: '0.35rem 0 0.5rem 0', fontSize: '1.9rem' }}>Verify a URL before you click.</h2>
              <p style={{ color: THEME.textMuted, lineHeight: 1.6 }}>
                Use the same verification flow shown in the extension demo. This is the cleanest entry point for screenshots.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                value={quickUrl}
                onChange={(event) => setQuickUrl(event.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '1rem 1.05rem',
                  borderRadius: '16px',
                  border: `1px solid ${THEME.panelBorder}`,
                  background: THEME.panelStrong,
                  color: THEME.text,
                  fontSize: '1rem'
                }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={runQuickCheck}
                  disabled={quickLoading}
                  style={{
                    background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentStrong})`,
                    color: '#042033',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '0.95rem 1.2rem',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: quickLoading ? 'wait' : 'pointer'
                  }}
                >
                  {quickLoading ? 'Checking...' : 'Check URL now'}
                </button>
                <button
                  onClick={() => onNavigate?.('simulator')}
                  style={{
                    background: 'transparent',
                    color: THEME.text,
                    border: `1px solid ${THEME.panelBorder}`,
                    borderRadius: '14px',
                    padding: '0.95rem 1.2rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Open Training Lab
                </button>
              </div>
            </div>

            {quickError && <div style={{ color: THEME.dangerous, marginTop: '0.9rem' }}>{quickError}</div>}

            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                borderRadius: '18px',
                border: `1px solid ${verdictStyle.border}`,
                background: verdictStyle.background
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ color: THEME.textMuted, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current result</div>
                <div
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: '999px',
                    background: verdictStyle.color,
                    color: '#04111d',
                    fontSize: '0.82rem',
                    fontWeight: 800
                  }}
                >
                  {quickResult?.verdict || 'Ready'}
                </div>
              </div>
              <div style={{ fontSize: '1rem', lineHeight: 1.55, color: THEME.textMuted }}>
                {quickResult
                  ? quickResult.recommendations?.[0] || `Verdict for ${quickResult.domain || quickUrl}`
                  : 'Try with https://devpost.com/ for a safe case or a suspicious test domain for a warning state.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.65rem', marginTop: '1rem' }}>
              {['SAFE', 'SUSPICIOUS', 'DANGEROUS', 'UNVERIFIED'].map((key) => {
                const risk = getRiskStyle(key);
                return (
                  <div
                    key={key}
                    style={{
                      padding: '0.85rem 0.7rem',
                      borderRadius: '14px',
                      border: `1px solid ${risk.border}`,
                      background: risk.background,
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ color: risk.color, fontWeight: 800, marginBottom: '0.2rem' }}>{risk.label}</div>
                    <div style={{ color: THEME.textMuted, fontSize: '0.77rem' }}>Shared UI state</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: THEME.panel,
                border: `1px solid ${THEME.panelBorder}`,
                borderRadius: '20px',
                padding: '1.4rem',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ color: card.tone, fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{card.value}</div>
              <div style={{ color: THEME.textMuted, fontSize: '0.95rem' }}>{card.label}</div>
            </div>
          ))}
        </section>

        <section
          style={{
            background: THEME.panel,
            border: `1px solid ${THEME.panelBorder}`,
            borderRadius: '24px',
            padding: '1.4rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.28)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Protection activity</h2>
              <p style={{ margin: '0.3rem 0 0 0', color: THEME.textMuted }}>Runtime verification volume used by the demo and dashboard.</p>
            </div>
            <div>
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setRange(days)}
                  style={{
                    background: range === days ? THEME.accent : 'transparent',
                    color: range === days ? '#04111d' : THEME.text,
                    border: `1px solid ${THEME.panelBorder}`,
                    padding: '0.45rem 0.8rem',
                    borderRadius: '999px',
                    marginLeft: '0.4rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="homeActivityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME.accent} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={THEME.accent} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
                <XAxis dataKey="day" stroke={THEME.textMuted} />
                <YAxis stroke={THEME.textMuted} />
                <Tooltip
                  contentStyle={{
                    background: '#091424',
                    border: `1px solid ${THEME.panelBorder}`,
                    color: THEME.text,
                    borderRadius: '12px'
                  }}
                />
                <Area type="monotone" dataKey="value" stroke={THEME.accent} strokeWidth={2.5} fillOpacity={1} fill="url(#homeActivityFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
