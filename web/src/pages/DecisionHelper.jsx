import { useState } from 'react';
import { API_BASE_URL } from '../config';
import { THEME, getRiskStyle } from '../theme';

const safeEmailSample = {
  sender: 'team@github.com',
  subject: 'Your GitHub security alert',
  body: 'We detected a new SSH key added to your account. If this was not you, please review your keys in https://github.com/settings/keys.'
};

const dangerousEmailSample = {
  sender: 'security@paypa1-verify.tk',
  subject: 'URGENT: Your account will be closed in 24 hours',
  body: 'Dear customer, your account has been limited. Verify now at http://paypa1-secure.tk/login to avoid suspension.'
};

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? THEME.accent : 'transparent',
        color: active ? '#04111d' : THEME.text,
        border: `1px solid ${THEME.panelBorder}`,
        borderRadius: '999px',
        padding: '0.65rem 1rem',
        fontWeight: 800,
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}

export default function DecisionHelper() {
  const [mode, setMode] = useState('url');
  const [url, setUrl] = useState('https://devpost.com/');
  const [urlResult, setUrlResult] = useState(null);
  const [emailInput, setEmailInput] = useState(dangerousEmailSample);
  const [emailResult, setEmailResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifyUrl = async () => {
    setError('');
    setUrlResult(null);
    if (!url.trim()) {
      setError('Please enter a URL.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Verification request failed');
      setUrlResult(data);
    } catch (requestError) {
      setError(requestError.message || 'Verification request failed');
    } finally {
      setLoading(false);
    }
  };

  const analyzeEmail = async () => {
    setError('');
    setEmailResult(null);

    if (!emailInput.sender.trim() || !emailInput.subject.trim() || !emailInput.body.trim()) {
      setError('Sender, subject, and body are required.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/email/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailInput)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Email analysis failed');
      setEmailResult(data);
    } catch (requestError) {
      setError(requestError.message || 'Email analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const currentVerdict = mode === 'url' ? urlResult?.verdict : emailResult?.verdict;
  const verdictStyle = getRiskStyle(currentVerdict);

  return (
    <div style={{ padding: '2rem', color: THEME.text, background: THEME.bg, minHeight: '100%' }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
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
            Manual analysis
          </div>
          <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Decision Helper</h1>
          <p style={{ color: THEME.textMuted, marginTop: '0.6rem', lineHeight: 1.65, maxWidth: '780px' }}>
            Analyze suspicious URLs before clicking, or paste suspicious emails to detect urgency, impersonation, and risky link patterns without claiming full inbox integration.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <TabButton active={mode === 'url'} onClick={() => { setMode('url'); setError(''); }}>
            URL Analyzer
          </TabButton>
          <TabButton active={mode === 'email'} onClick={() => { setMode('email'); setError(''); }}>
            Email Risk Analyzer
          </TabButton>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1rem'
          }}
        >
          <div
            style={{
              background: THEME.panel,
              border: `1px solid ${THEME.panelBorder}`,
              borderRadius: '22px',
              padding: '1.4rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
            }}
          >
            {mode === 'url' ? (
              <>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Verify a URL</h2>
                <p style={{ color: THEME.textMuted, marginBottom: '1rem', lineHeight: 1.55 }}>
                  Use this to test the same verification logic that powers the browser extension.
                </p>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    borderRadius: '14px',
                    border: `1px solid ${THEME.panelBorder}`,
                    background: THEME.panelStrong,
                    color: THEME.text,
                    marginBottom: '0.9rem'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={verifyUrl}
                    disabled={loading}
                    style={{
                      background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentStrong})`,
                      color: '#04111d',
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      border: 'none',
                      fontWeight: 800,
                      cursor: loading ? 'wait' : 'pointer'
                    }}
                  >
                    {loading ? 'Checking...' : 'Verify URL'}
                  </button>
                  <button
                    onClick={() => setUrl('https://devpost.com/')}
                    style={{
                      background: 'transparent',
                      color: THEME.text,
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      border: `1px solid ${THEME.panelBorder}`,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Safe sample
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Analyze suspicious email content</h2>
                <p style={{ color: THEME.textMuted, marginBottom: '1rem', lineHeight: 1.55 }}>
                  Paste sender, subject and body to inspect urgency tactics, impersonation signals and malicious link patterns before clicking.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input
                    type="text"
                    value={emailInput.sender}
                    onChange={(event) => setEmailInput((prev) => ({ ...prev, sender: event.target.value }))}
                    placeholder="Sender"
                    style={{
                      width: '100%',
                      padding: '0.9rem',
                      borderRadius: '14px',
                      border: `1px solid ${THEME.panelBorder}`,
                      background: THEME.panelStrong,
                      color: THEME.text
                    }}
                  />
                  <input
                    type="text"
                    value={emailInput.subject}
                    onChange={(event) => setEmailInput((prev) => ({ ...prev, subject: event.target.value }))}
                    placeholder="Subject"
                    style={{
                      width: '100%',
                      padding: '0.9rem',
                      borderRadius: '14px',
                      border: `1px solid ${THEME.panelBorder}`,
                      background: THEME.panelStrong,
                      color: THEME.text
                    }}
                  />
                  <textarea
                    rows="8"
                    value={emailInput.body}
                    onChange={(event) => setEmailInput((prev) => ({ ...prev, body: event.target.value }))}
                    placeholder="Paste suspicious email body"
                    style={{
                      width: '100%',
                      padding: '0.95rem',
                      borderRadius: '14px',
                      border: `1px solid ${THEME.panelBorder}`,
                      background: THEME.panelStrong,
                      color: THEME.text,
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
                  <button
                    onClick={analyzeEmail}
                    disabled={loading}
                    style={{
                      background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentStrong})`,
                      color: '#04111d',
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      border: 'none',
                      fontWeight: 800,
                      cursor: loading ? 'wait' : 'pointer'
                    }}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Email Risk'}
                  </button>
                  <button
                    onClick={() => setEmailInput(dangerousEmailSample)}
                    style={{
                      background: 'transparent',
                      color: THEME.text,
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      border: `1px solid ${THEME.panelBorder}`,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Phishing sample
                  </button>
                  <button
                    onClick={() => setEmailInput(safeEmailSample)}
                    style={{
                      background: 'transparent',
                      color: THEME.text,
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      border: `1px solid ${THEME.panelBorder}`,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Safe sample
                  </button>
                </div>
              </>
            )}

            {error && <div style={{ color: THEME.dangerous, marginTop: '1rem' }}>{error}</div>}
          </div>

          <div
            style={{
              background: THEME.panel,
              border: `1px solid ${THEME.panelBorder}`,
              borderRadius: '22px',
              padding: '1.4rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Analysis result</h2>
              <div
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '999px',
                  background: verdictStyle.color,
                  color: '#04111d',
                  fontWeight: 800,
                  minWidth: '110px',
                  textAlign: 'center'
                }}
              >
                {currentVerdict || 'READY'}
              </div>
            </div>

            {mode === 'url' && urlResult && (
              <>
                <div style={{ color: THEME.textMuted, marginBottom: '0.7rem' }}>Domain: {urlResult.domain}</div>
                {urlResult.riskIndicators?.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.55rem' }}>Risk indicators</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {urlResult.riskIndicators.map((indicator, index) => (
                        <IndicatorCard key={`${indicator.title}-${index}`} indicator={indicator} />
                      ))}
                    </div>
                  </div>
                )}
                <RecommendationList items={urlResult.recommendations} />
              </>
            )}

            {mode === 'email' && emailResult && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                  <MetricCard label="Risk score" value={`${emailResult.riskScore}/100`} color={verdictStyle.color} />
                  <MetricCard label="Suspicious links" value={String(emailResult.suspiciousLinks?.length || 0)} color={THEME.suspicious} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.55rem' }}>Risk indicators</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {(emailResult.riskIndicators || []).map((indicator, index) => (
                      <IndicatorCard key={`${indicator.title}-${index}`} indicator={indicator} />
                    ))}
                  </div>
                </div>
                {emailResult.suspiciousLinks?.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Embedded links</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {emailResult.suspiciousLinks.map((link) => (
                        <code
                          key={link}
                          style={{
                            display: 'block',
                            padding: '0.65rem 0.75rem',
                            borderRadius: '12px',
                            background: THEME.panelStrong,
                            border: `1px solid ${THEME.panelBorder}`,
                            color: THEME.textMuted,
                            wordBreak: 'break-all'
                          }}
                        >
                          {link}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
                <RecommendationList items={emailResult.recommendations} />
              </>
            )}

            {!urlResult && !emailResult && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '16px',
                  background: THEME.panelStrong,
                  border: `1px solid ${THEME.panelBorder}`,
                  color: THEME.textMuted,
                  lineHeight: 1.6
                }}
              >
                Run a URL check or analyze a suspicious email sample to generate a verdict and explainable risk indicators.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div
      style={{
        padding: '0.9rem',
        borderRadius: '16px',
        background: THEME.panelStrong,
        border: `1px solid ${THEME.panelBorder}`
      }}
    >
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color, marginBottom: '0.2rem' }}>{value}</div>
      <div style={{ color: THEME.textMuted, fontSize: '0.88rem' }}>{label}</div>
    </div>
  );
}

function IndicatorCard({ indicator }) {
  const severityColor =
    indicator.severity === 'HIGH' ? THEME.dangerous :
    indicator.severity === 'MEDIUM' ? THEME.suspicious :
    THEME.safe;

  return (
    <div
      style={{
        padding: '0.85rem',
        borderRadius: '14px',
        background: THEME.panelStrong,
        border: `1px solid ${THEME.panelBorder}`
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.4rem' }}>
        <div style={{ fontWeight: 700 }}>{indicator.title}</div>
        <div
          style={{
            padding: '0.2rem 0.55rem',
            borderRadius: '999px',
            background: severityColor,
            color: '#04111d',
            fontSize: '0.72rem',
            fontWeight: 800
          }}
        >
          {indicator.severity}
        </div>
      </div>
      {indicator.detail && <div style={{ color: THEME.textMuted, lineHeight: 1.5, marginBottom: '0.35rem' }}>{indicator.detail}</div>}
      <div style={{ color: THEME.textMuted, fontSize: '0.78rem' }}>Source: {indicator.source || 'analysis'}</div>
    </div>
  );
}

function RecommendationList({ items = [] }) {
  if (!items.length) return null;

  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Recommended action</div>
      <ul style={{ margin: 0, paddingLeft: '1.15rem', color: THEME.textMuted, lineHeight: 1.65 }}>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
