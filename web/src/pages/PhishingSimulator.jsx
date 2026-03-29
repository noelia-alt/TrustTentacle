import { useMemo, useState } from 'react';
import { THEME, getRiskStyle } from '../theme';

const scenarios = [
  {
    id: 1,
    source: 'Email',
    title: 'PayPal account verification request',
    from: 'security@paypa1-verify.tk',
    body:
      'Dear valued customer,\n\nYour PayPal account has been locked due to suspicious activity. Click here immediately to verify your identity or your account will be permanently closed.\n\nVerify now: http://paypa1-secure.tk/login',
    verdict: 'DANGEROUS',
    rationale: [
      'Typosquatting in the sender domain.',
      'High urgency and account closure pressure.',
      'Suspicious TLD and off-brand verification URL.'
    ]
  },
  {
    id: 2,
    source: 'Email',
    title: 'Microsoft 365 renewal notice',
    from: 'support@microsoft.com',
    body:
      'Your Microsoft 365 subscription renews automatically on February 1 for $99.99. To review subscription details, sign in to your Microsoft account from the official portal.',
    verdict: 'SAFE',
    rationale: [
      'Official domain and neutral wording.',
      'No request for credentials through an external link.',
      'Reasonable billing notice with no panic trigger.'
    ]
  },
  {
    id: 3,
    source: 'SMS',
    title: 'Bank transaction confirmation',
    from: '+1 (800) 555-0123',
    body:
      'Bank of America: unusual activity detected on account ending in 4892. Reply YES to confirm or NO to block. Ref: BA-SEC-9182.',
    verdict: 'SUSPICIOUS',
    rationale: [
      'SMS response workflow is atypical for fraud remediation.',
      'Pressure to act immediately from a generic phone number.',
      'Message uses authority and fear without a trusted channel.'
    ]
  },
  {
    id: 4,
    source: 'Email',
    title: 'GitHub SSH key alert',
    from: 'team@github.com',
    body:
      'We detected a new SSH key added to your account. If this was not you, please review your keys in https://github.com/settings/keys.',
    verdict: 'SAFE',
    rationale: [
      'Official sender domain.',
      'Link points to a legitimate GitHub settings path.',
      'Guides the user back to the platform rather than asking for secrets.'
    ]
  }
];

export default function PhishingSimulator({ onNavigate }) {
  const [phase, setPhase] = useState('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [review, setReview] = useState(null);

  const current = scenarios[index];
  const completed = answers.length;

  const result = useMemo(() => {
    if (!answers.length) {
      return { score: 0, accuracy: 0 };
    }
    const score = answers.filter((entry) => entry.correct).length;
    return {
      score,
      accuracy: Math.round((score / answers.length) * 100)
    };
  }, [answers]);

  const submitAnswer = (guess) => {
    const correct = guess === current.verdict;
    const nextAnswers = [...answers, { scenarioId: current.id, guess, correct }];
    setAnswers(nextAnswers);
    setReview({ guess, correct, verdict: current.verdict });
  };

  const nextScenario = () => {
    setReview(null);
    if (index === scenarios.length - 1) {
      setPhase('summary');
      return;
    }
    setIndex(index + 1);
  };

  const restart = () => {
    setPhase('intro');
    setIndex(0);
    setAnswers([]);
    setReview(null);
  };

  if (phase === 'intro') {
    return (
      <div style={{ background: THEME.bg, color: THEME.text, minHeight: '100vh', padding: '2rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div
            style={{
              background: THEME.panel,
              border: `1px solid ${THEME.panelBorder}`,
              borderRadius: '28px',
              padding: '2rem',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.34)'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: '0.42rem 0.8rem',
                borderRadius: '999px',
                background: THEME.accentSoft,
                border: `1px solid ${THEME.panelBorder}`,
                color: THEME.accent,
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '1rem'
              }}
            >
              Security Training Lab
            </div>
            <h1 style={{ fontSize: '3rem', margin: 0 }}>Practice fast phishing judgment in a controlled flow.</h1>
            <p style={{ color: THEME.textMuted, lineHeight: 1.7, fontSize: '1.04rem', margin: '1rem 0 1.5rem 0', maxWidth: '780px' }}>
              This module is intentionally secondary to the live protection demo. Use it to show educational value: realistic messages, quick operator decisions and transparent reasoning for each outcome.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem', marginBottom: '1.4rem' }}>
              {[
                { title: '4 scenarios', text: 'Email and SMS cases covering safe and risky patterns.' },
                { title: 'Clear outcomes', text: 'Safe, suspicious and dangerous states match the product palette.' },
                { title: 'Readable rationale', text: 'Each answer explains why the message should be trusted or avoided.' }
              ].map((card) => (
                <div
                  key={card.title}
                  style={{
                    background: THEME.panelStrong,
                    border: `1px solid ${THEME.panelBorder}`,
                    borderRadius: '18px',
                    padding: '1rem'
                  }}
                >
                  <div style={{ color: THEME.accent, fontWeight: 700, marginBottom: '0.4rem' }}>{card.title}</div>
                  <div style={{ color: THEME.textMuted, fontSize: '0.92rem', lineHeight: 1.55 }}>{card.text}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase('playing')}
              style={{
                background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentStrong})`,
                color: '#04111d',
                border: 'none',
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Start training sequence
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'summary') {
    return (
      <div style={{ background: THEME.bg, color: THEME.text, minHeight: '100vh', padding: '2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div
            style={{
              background: THEME.panel,
              border: `1px solid ${THEME.panelBorder}`,
              borderRadius: '28px',
              padding: '2rem',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.34)'
            }}
          >
            <h1 style={{ fontSize: '2.6rem', margin: '0 0 0.75rem 0' }}>Training summary</h1>
            <p style={{ color: THEME.textMuted, fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              This screen positions the simulator as a training lab, not as the MVP centerpiece.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: THEME.panelStrong, border: `1px solid ${THEME.panelBorder}`, borderRadius: '18px', padding: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: THEME.accent }}>{result.score}</div>
                <div style={{ color: THEME.textMuted }}>Correct classifications</div>
              </div>
              <div style={{ background: THEME.panelStrong, border: `1px solid ${THEME.panelBorder}`, borderRadius: '18px', padding: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: THEME.safe }}>{result.accuracy}%</div>
                <div style={{ color: THEME.textMuted }}>Accuracy</div>
              </div>
              <div style={{ background: THEME.panelStrong, border: `1px solid ${THEME.panelBorder}`, borderRadius: '18px', padding: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: THEME.suspicious }}>{scenarios.length}</div>
                <div style={{ color: THEME.textMuted }}>Scenarios reviewed</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button
                onClick={restart}
                style={{
                  background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentStrong})`,
                  color: '#04111d',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '0.9rem 1.15rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Run again
              </button>
              <button
                onClick={() => onNavigate?.('home')}
                style={{
                  background: 'transparent',
                  color: THEME.text,
                  border: `1px solid ${THEME.panelBorder}`,
                  borderRadius: '14px',
                  padding: '0.9rem 1.15rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Return to product flow
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const risk = getRiskStyle(current.verdict);

  return (
    <div style={{ background: THEME.bg, color: THEME.text, minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: THEME.accent, fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Security Training Lab
            </div>
            <h1 style={{ margin: '0.35rem 0 0 0', fontSize: '2.4rem' }}>{current.title}</h1>
          </div>
          <div style={{ color: THEME.textMuted, fontWeight: 700 }}>
            Scenario {completed + 1} of {scenarios.length}
          </div>
        </div>

        <div
          style={{
            background: THEME.panel,
            border: `1px solid ${THEME.panelBorder}`,
            borderRadius: '24px',
            padding: '1.5rem',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.34)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: THEME.textMuted, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{current.source}</div>
              <div style={{ marginTop: '0.35rem', fontWeight: 700 }}>From: {current.from}</div>
            </div>
            <div
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '999px',
                border: `1px solid ${THEME.panelBorder}`,
                background: THEME.accentSoft,
                color: THEME.accent,
                fontWeight: 800
              }}
            >
              Analyst decision required
            </div>
          </div>

          <div
            style={{
              background: THEME.panelStrong,
              border: `1px solid ${THEME.panelBorder}`,
              borderRadius: '18px',
              padding: '1.25rem',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              color: THEME.textMuted,
              marginBottom: '1rem'
            }}
          >
            {current.body}
          </div>

          <div style={{ color: THEME.textMuted, marginBottom: '0.85rem' }}>
            Choose the most appropriate product state for this message.
          </div>

          {!review && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              {['SAFE', 'SUSPICIOUS', 'DANGEROUS'].map((option) => {
                const optionStyle = getRiskStyle(option);
                return (
                  <button
                    key={option}
                    onClick={() => submitAnswer(option)}
                    style={{
                      padding: '1rem',
                      borderRadius: '16px',
                      border: `1px solid ${optionStyle.border}`,
                      background: optionStyle.background,
                      color: optionStyle.color,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {optionStyle.label}
                  </button>
                );
              })}
            </div>
          )}

          {review && (
            <div
              style={{
                background: review.correct ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${review.correct ? 'rgba(34, 197, 94, 0.36)' : 'rgba(239, 68, 68, 0.36)'}`,
                borderRadius: '18px',
                padding: '1rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: '0.4rem', color: review.correct ? THEME.safe : THEME.dangerous }}>
                {review.correct ? 'Correct classification' : 'Incorrect classification'}
              </div>
              <div style={{ color: THEME.textMuted, lineHeight: 1.6 }}>
                Your answer: {getRiskStyle(review.guess).label}. Correct state: {risk.label}.
              </div>
            </div>
          )}

          <div
            style={{
              background: 'rgba(34, 211, 238, 0.08)',
              border: `1px solid ${THEME.panelBorder}`,
              borderRadius: '18px',
              padding: '1rem'
            }}
          >
            <div style={{ color: THEME.accent, fontWeight: 700, marginBottom: '0.5rem' }}>Why this case matters</div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: THEME.textMuted, lineHeight: 1.65 }}>
              {current.rationale.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {review && (
            <button
              onClick={nextScenario}
              style={{
                marginTop: '1rem',
                background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentStrong})`,
                color: '#04111d',
                border: 'none',
                borderRadius: '14px',
                padding: '0.95rem 1.1rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {index === scenarios.length - 1 ? 'View summary' : 'Next scenario'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
