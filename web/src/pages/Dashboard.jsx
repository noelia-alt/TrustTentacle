import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../config';
import { THEME, getRiskStyle } from '../theme';

const fallbackActivity = [
  { day: 'Mon', value: 180 },
  { day: 'Tue', value: 210 },
  { day: 'Wed', value: 190 },
  { day: 'Thu', value: 230 },
  { day: 'Fri', value: 260 },
  { day: 'Sat', value: 240 },
  { day: 'Sun', value: 243 }
];

const fallbackThreats = [
  { url: 'paypa1-secure.tk', verdict: 'DANGEROUS', detected: '2 min ago', signal: 'Typosquatting' },
  { url: 'g00gle-verify.ml', verdict: 'DANGEROUS', detected: '5 min ago', signal: 'Brand impersonation' },
  { url: 'amaz0n-login.ga', verdict: 'SUSPICIOUS', detected: '8 min ago', signal: 'Credential harvest pattern' },
  { url: 'secure-bank.cf', verdict: 'UNVERIFIED', detected: '12 min ago', signal: 'Unknown domain' }
];

export default function Dashboard() {
  const [summary, setSummary] = useState({
    urlsChecked: 0,
    threatsBlocked: 0,
    reportsSubmitted: 0
  });
  const [activitySeries, setActivitySeries] = useState(fallbackActivity);
  const [range, setRange] = useState(7);
  const [signals, setSignals] = useState([
    { name: 'Blockchain Registry', status: 'active' },
    { name: 'Community Reports', status: 'active' },
    { name: 'Threat Intelligence', status: 'active' },
    { name: 'Heuristic Analysis', status: 'active' }
  ]);
  const [threats, setThreats] = useState(fallbackThreats);

  useEffect(() => {
    fetch(`${API_BASE_URL}/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!data?.protection) return;
        setSummary(data.protection);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/stats/activity?days=${range}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!data?.series) return;
        setActivitySeries(data.series.map((point) => ({ day: point.date.slice(5), value: point.value })));
      })
      .catch(() => {});
  }, [range]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/stats/tentacles`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!data?.tentacles) return;
        setSignals(data.tentacles.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/threats/recent`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!data?.threats?.length) return;
        const mapped = data.threats.slice(0, 4).map((threat) => ({
          url: threat.url || threat.domain || threat.hostname || 'unknown',
          verdict: (threat.verdict || threat.severity || 'SUSPICIOUS').toUpperCase(),
          detected: threat.detectedAt || threat.time || 'recently',
          signal: threat.type || threat.reason || 'Community detection'
        }));
        setThreats(mapped);
      })
      .catch(() => {});
  }, []);

  const cards = [
    {
      label: 'Sites verified',
      value: summary.urlsChecked || 0,
      color: THEME.accent,
      detail: 'Verification requests processed'
    },
    {
      label: 'Threats blocked',
      value: summary.threatsBlocked || 0,
      color: THEME.dangerous,
      detail: 'Dangerous or suspicious outcomes'
    },
    {
      label: 'Reports submitted',
      value: summary.reportsSubmitted || 0,
      color: THEME.suspicious,
      detail: 'Community reports recorded'
    }
  ];

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
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.4rem 0.8rem',
              borderRadius: '999px',
              background: THEME.accentSoft,
              border: `1px solid ${THEME.panelBorder}`,
              color: THEME.accent,
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.9rem'
            }}
          >
            Executive view
          </div>
          <h1 style={{ fontSize: '3rem', margin: 0 }}>Protection Dashboard</h1>
          <p style={{ color: THEME.textMuted, fontSize: '1.05rem', marginTop: '0.5rem', maxWidth: '760px', lineHeight: 1.6 }}>
            A concise operator view of what the browser extension and backend are doing right now. This screen should read clearly in screenshots and live demos.
          </p>
        </div>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          {cards.map((card) => (
            <div
              key={card.label}
              style={{
                background: THEME.panel,
                border: `1px solid ${THEME.panelBorder}`,
                borderRadius: '20px',
                padding: '1.35rem',
                boxShadow: '0 18px 48px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: card.color, marginBottom: '0.35rem' }}>{card.value}</div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.25rem' }}>{card.label}</div>
              <div style={{ fontSize: '0.84rem', color: THEME.textMuted }}>{card.detail}</div>
            </div>
          ))}
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div
            style={{
              background: THEME.panel,
              border: `1px solid ${THEME.panelBorder}`,
              borderRadius: '24px',
              padding: '1.4rem',
              boxShadow: '0 18px 48px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Protection Activity</h2>
                <p style={{ margin: '0.3rem 0 0 0', color: THEME.textMuted }}>7/14/30-day runtime view from backend activity.</p>
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
                <AreaChart data={activitySeries} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardActivityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={THEME.accent} stopOpacity={0.45} />
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
                  <Area type="monotone" dataKey="value" stroke={THEME.accent} strokeWidth={2.5} fillOpacity={1} fill="url(#dashboardActivityFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            style={{
              background: THEME.panel,
              border: `1px solid ${THEME.panelBorder}`,
              borderRadius: '24px',
              padding: '1.4rem',
              boxShadow: '0 18px 48px rgba(0, 0, 0, 0.25)'
            }}
          >
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem' }}>Core Signals</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {signals.map((signal) => (
                <div
                  key={signal.name}
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '16px',
                    background: THEME.panelStrong,
                    border: `1px solid ${THEME.panelBorder}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.8rem',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{signal.name}</div>
                    <div style={{ color: THEME.textMuted, fontSize: '0.84rem' }}>Live signal in MVP path</div>
                  </div>
                  <div
                    style={{
                      background: signal.status === 'active' ? THEME.safe : THEME.unverified,
                      color: '#04111d',
                      borderRadius: '999px',
                      padding: '0.32rem 0.7rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}
                  >
                    {signal.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            background: THEME.panel,
            border: `1px solid ${THEME.panelBorder}`,
            borderRadius: '24px',
            padding: '1.4rem',
            boxShadow: '0 18px 48px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Recent detections</h2>
              <p style={{ margin: '0.3rem 0 0 0', color: THEME.textMuted }}>Short list optimized for stage demo narration.</p>
            </div>
            <div style={{ color: THEME.textMuted, fontSize: '0.88rem' }}>Top 4 signals</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.9rem' }}>
            {threats.map((threat) => {
              const risk = getRiskStyle(threat.verdict);
              return (
                <div
                  key={`${threat.url}-${threat.detected}`}
                  style={{
                    padding: '1rem',
                    borderRadius: '18px',
                    background: risk.background,
                    border: `1px solid ${risk.border}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, wordBreak: 'break-word' }}>{threat.url}</div>
                    <div
                      style={{
                        background: risk.color,
                        color: '#04111d',
                        borderRadius: '999px',
                        padding: '0.28rem 0.65rem',
                        fontSize: '0.76rem',
                        fontWeight: 800
                      }}
                    >
                      {risk.label}
                    </div>
                  </div>
                  <div style={{ color: THEME.textMuted, fontSize: '0.88rem', marginBottom: '0.35rem' }}>{threat.signal}</div>
                  <div style={{ color: THEME.textMuted, fontSize: '0.78rem' }}>{threat.detected}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
