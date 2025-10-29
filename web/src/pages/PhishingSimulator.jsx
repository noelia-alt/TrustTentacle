import { useState, useEffect } from 'react'

export default function PhishingSimulator() {
  const [gameState, setGameState] = useState('menu') // menu, playing, result
  const [currentScenario, setCurrentScenario] = useState(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [level, setLevel] = useState(1)
  const [scenariosCompleted, setScenariosCompleted] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)

  // Realistic phishing scenarios with different difficulty levels
  const scenarios = [
    // LEVEL 1 - EASY (Obvious)
    {
      level: 1,
      type: 'email',
      from: 'security@paypa1-verify.tk',
      subject: 'URGENT: Your account will be closed in 24 hours!!!',
      body: 'Dear valued customer,\n\nYour PayPal account has been locked due to suspicious activity. Click here immediately to verify your identity or your account will be permanently closed.\n\nVerify Now: http://paypa1-secure.tk/login\n\nPayPal Security Team',
      isPhishing: true,
      difficulty: 'Easy',
      redFlags: [
        'Suspicious domain (paypa1 instead of paypal)',
        'Free TLD (.tk)',
        'Extreme urgency ("24 hours")',
        'Multiple exclamation marks',
        'Generic greeting ("Dear valued customer")',
        'URL doesn\'t match official domain'
      ],
      technique: 'Typosquatting + Urgency',
      points: 10
    },
    {
      level: 1,
      type: 'email',
      from: 'noreply@paypal.com',
      subject: 'Your recent transaction',
      body: 'Hello,\n\nYour payment of $49.99 to Netflix has been processed successfully.\n\nTransaction ID: PP-2024-891234\nDate: January 15, 2025\n\nThank you for using PayPal.\n\nPayPal Team',
      isPhishing: false,
      difficulty: 'Easy',
      safeIndicators: [
        'Legitimate domain (@paypal.com)',
        'No artificial urgency',
        'Doesn\'t ask for personal information',
        'Correct grammar',
        'Specific information (transaction ID)',
        'No suspicious links'
      ],
      points: 10
    },
    // LEVEL 2 - MEDIUM (More sophisticated)
    {
      level: 2,
      type: 'sms',
      from: '+1 (800) 555-0123',
      subject: null,
      body: 'Bank of America: We detected unusual activity on your account ending in 4892. Please verify this transaction: $1,247.50 at Amazon.com. Reply YES to confirm or NO to block. Ref: BA-SEC-9182',
      isPhishing: true,
      difficulty: 'Medium',
      redFlags: [
        'Requests SMS reply (banks don\'t do this)',
        'Generic number (not verifiable)',
        'Pressure to respond quickly',
        'High amount to create alarm',
        'Fake reference code to seem legitimate',
        'Real banks use apps/calls, not SMS for this'
      ],
      technique: 'Smishing + False Authority',
      points: 20
    },
    {
      level: 2,
      type: 'email',
      from: 'support@microsoft.com',
      subject: 'Your Microsoft 365 subscription renewal',
      body: 'Dear Customer,\n\nYour Microsoft 365 subscription will renew automatically on February 1, 2025 for $99.99.\n\nTo view your subscription details or make changes, sign in to your Microsoft account.\n\nBest regards,\nMicrosoft Support',
      isPhishing: false,
      difficulty: 'Medium',
      safeIndicators: [
        'Official Microsoft domain',
        'No direct links (asks you to sign in yourself)',
        'Clear renewal information',
        'No artificial urgency',
        'Professional grammar',
        'Doesn\'t request personal information'
      ],
      points: 20
    },
    // LEVEL 3 - HARD (Very sophisticated)
    {
      level: 3,
      type: 'email',
      from: 'security-alert@amazon-services.com',
      subject: 'Security Alert: New device sign-in from Chrome on Windows',
      body: 'Hi [Your Name],\n\nWe noticed a new sign-in to your Amazon account from:\n\nDevice: Chrome on Windows 11\nLocation: New York, NY\nTime: Today at 2:34 PM EST\n\nIf this was you, you can ignore this email. If you don\'t recognize this activity, please secure your account immediately:\n\nhttps://amazon-security.com/verify-signin/ref=sec_alert_2025\n\nAmazon Security Team\nThis is an automated message, please do not reply.',
      isPhishing: true,
      difficulty: 'Hard',
      redFlags: [
        'Similar but incorrect domain (amazon-services.com vs amazon.com)',
        'Suspicious URL (amazon-security.com is separate domain)',
        'Fake personalization ([Your Name] without real name)',
        'Specific details to seem legitimate',
        'Professional format mimicking real emails',
        'Uses HTTPS to appear secure (but domain is fake)'
      ],
      technique: 'Spear Phishing + Domain Spoofing',
      points: 30
    },
    {
      level: 3,
      type: 'email',
      from: 'team@github.com',
      subject: 'Your GitHub security alert',
      body: 'Hi there,\n\nWe detected a new SSH key was added to your account:\n\nKey fingerprint: SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8\nAdded: January 15, 2025 at 3:45 PM UTC\n\nIf you added this key, no action is needed. If you didn\'t add this key, please review your account security settings immediately.\n\nView your SSH keys: https://github.com/settings/keys\n\nGitHub Security',
      isPhishing: false,
      difficulty: 'Hard',
      safeIndicators: [
        'Official GitHub domain (@github.com)',
        'URL points to real GitHub domain',
        'Specific technical information (real fingerprint)',
        'Doesn\'t pressure immediate action',
        'Directs you to check YOURSELF on official site',
        'Format consistent with real GitHub alerts'
      ],
      points: 30
    },
    // LEVEL 4 - EXPERT (APT-style)
    {
      level: 4,
      type: 'email',
      from: 'ceo@yourcompany.com',
      subject: 'Re: Urgent wire transfer needed',
      body: 'Hi,\n\nI\'m in a meeting with investors and need you to process an urgent wire transfer. Our regular CFO is out sick.\n\nAmount: $45,000\nRecipient: Stellar Consulting LLC\nAccount: [Details in attached PDF]\n\nPlease handle this ASAP. I\'ll be in meetings all day so call my cell if issues: +1 (555) 0199\n\nThanks,\nJohn Smith\nCEO\n\nSent from my iPhone',
      isPhishing: true,
      difficulty: 'Expert',
      redFlags: [
        'CEO Fraud / Business Email Compromise (BEC)',
        'Urgency + authority to avoid verification',
        'Excuse for not being able to contact normally',
        'Significant but not extreme amount',
        '"Sent from iPhone" signature to justify brevity',
        'Suspicious attachment (PDF with "details")',
        'Unverifiable cell number',
        'Takes advantage of CFO\'s absence'
      ],
      technique: 'CEO Fraud (BEC) + Social Engineering',
      points: 50
    }
  ]

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !showExplanation) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showExplanation) {
      handleAnswer(null) // Time's up
    }
  }, [timeLeft, gameState, showExplanation])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setStreak(0)
    setLevel(1)
    setScenariosCompleted(0)
    loadNextScenario()
  }

  const loadNextScenario = () => {
    // Seleccionar escenario según nivel del jugador
    const availableScenarios = scenarios.filter(s => s.level <= level)
    const randomScenario = availableScenarios[Math.floor(Math.random() * availableScenarios.length)]
    setCurrentScenario(randomScenario)
    setTimeLeft(30)
    setSelectedAnswer(null)
    setShowExplanation(false)
  }

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer)
    
    const isCorrect = answer === (currentScenario.isPhishing ? 'phishing' : 'safe')
    
    if (isCorrect) {
      const newScore = score + currentScenario.points + (streak * 5)
      setScore(newScore)
      setStreak(streak + 1)
      
      // Level up cada 3 aciertos consecutivos
      if ((streak + 1) % 3 === 0 && level < 4) {
        setLevel(level + 1)
      }
    } else {
      setStreak(0)
    }
    
    setScenariosCompleted(scenariosCompleted + 1)
    setShowExplanation(true)
  }

  const continueGame = () => {
    if (scenariosCompleted >= 10) {
      setGameState('result')
    } else {
      loadNextScenario()
    }
  }

  const getLevelBadge = () => {
    if (score >= 400) return { name: 'Security Expert', icon: '🏆', color: '#fbbf24' }
    if (score >= 300) return { name: 'Advanced Guardian', icon: '🛡️', color: '#8b5cf6' }
    if (score >= 200) return { name: 'Competent Detector', icon: '🎯', color: '#3b82f6' }
    if (score >= 100) return { name: 'Vigilant Apprentice', icon: '👁️', color: '#10b981' }
    return { name: 'Novice', icon: '🌱', color: '#6b7280' }
  }

  // MENU SCREEN
  if (gameState === 'menu') {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)',
        color: 'white',
        minHeight: '100vh',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '800px', textAlign: 'center' }}>
          <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🎮</div>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Phishing Simulator
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '3rem' }}>
            Train your anti-phishing instinct with realistic scenarios
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              🎯 How to Play:
            </h2>
            <ul style={{ lineHeight: '2', color: '#d1d5db', paddingLeft: '1.5rem' }}>
              <li>Analyze each scenario (email, SMS, etc.)</li>
              <li>Decide if it's <strong style={{ color: '#ef4444' }}>PHISHING</strong> or <strong style={{ color: '#10b981' }}>SAFE</strong></li>
              <li>You have <strong>30 seconds</strong> per scenario</li>
              <li>Earn points for correct answers</li>
              <li>Keep streaks to multiply points</li>
              <li>Unlock harder difficulty levels</li>
            </ul>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'rgba(139, 92, 246, 0.2)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #8b5cf6'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
              <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>10 Scenarios</div>
            </div>
            <div style={{
              background: 'rgba(139, 92, 246, 0.2)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #8b5cf6'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
              <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>4 Levels</div>
            </div>
            <div style={{
              background: 'rgba(139, 92, 246, 0.2)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #8b5cf6'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱️</div>
              <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>Real Time</div>
            </div>
            <div style={{
              background: 'rgba(139, 92, 246, 0.2)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #8b5cf6'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
              <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>Achievements</div>
            </div>
          </div>

          <button
            onClick={startGame}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: 'white',
              padding: '1.5rem 3rem',
              borderRadius: '0.75rem',
              border: 'none',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            🚀 Start Training
          </button>
        </div>
      </div>
    )
  }

  // GAME SCREEN
  if (gameState === 'playing' && currentScenario) {
    const isCorrect = selectedAnswer === (currentScenario.isPhishing ? 'phishing' : 'safe')
    
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)',
        color: 'white',
        minHeight: '100vh',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Header Stats */}
          <div style={{ display: 'flex', justifyContent: 'between', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              flex: 1
            }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{score}</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              flex: 1
            }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Streak</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>🔥 {streak}</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              flex: 1
            }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Level</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{level}</div>
            </div>
            <div style={{
              background: timeLeft <= 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              flex: 1,
              border: timeLeft <= 10 ? '2px solid #ef4444' : 'none'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Time</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft <= 10 ? '#ef4444' : 'white' }}>
                ⏱️ {timeLeft}s
              </div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                Scenario {scenariosCompleted + 1} of 10
              </span>
              <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                Difficulty: {currentScenario.difficulty}
              </span>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              height: '8px', 
              borderRadius: '9999px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: '#8b5cf6', 
                height: '100%', 
                width: `${((scenariosCompleted + 1) / 10) * 100}%`,
                transition: 'width 0.3s'
              }} />
            </div>
          </div>

          {/* Scenario Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'inline-block'
            }}>
              {currentScenario.type === 'email' ? '📧 Email' : '📱 SMS'}
            </div>

            {currentScenario.from && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: '#9ca3af' }}>From:</strong> {currentScenario.from}
              </div>
            )}
            {currentScenario.subject && (
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#9ca3af' }}>Subject:</strong> {currentScenario.subject}
              </div>
            )}
            
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '1.5rem',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              {currentScenario.body}
            </div>

            {!showExplanation && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => handleAnswer('phishing')}
                  disabled={selectedAnswer !== null}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    cursor: selectedAnswer ? 'not-allowed' : 'pointer',
                    opacity: selectedAnswer ? 0.5 : 1,
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => !selectedAnswer && (e.target.style.transform = 'scale(1.05)')}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                  🚨 IT'S PHISHING
                </button>
                <button
                  onClick={() => handleAnswer('safe')}
                  disabled={selectedAnswer !== null}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    cursor: selectedAnswer ? 'not-allowed' : 'pointer',
                    opacity: selectedAnswer ? 0.5 : 1,
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => !selectedAnswer && (e.target.style.transform = 'scale(1.05)')}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                  ✅ IT'S SAFE
                </button>
              </div>
            )}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div style={{
              background: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '2rem',
              border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}>
                {isCorrect ? '🎉' : '❌'}
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </h3>
              
              {isCorrect && (
                <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#d1d5db' }}>
                  +{currentScenario.points} points {streak > 0 && `+ ${streak * 5} streak bonus`}
                </p>
              )}

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {currentScenario.isPhishing ? '🚨 Red Flags:' : '✅ Safety Indicators:'}
                </h4>
                <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: '#d1d5db' }}>
                  {(currentScenario.isPhishing ? currentScenario.redFlags : currentScenario.safeIndicators).map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>

              {currentScenario.technique && (
                <div style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginTop: '1rem',
                  borderLeft: '4px solid #8b5cf6'
                }}>
                  <strong>🎯 Technique used:</strong> {currentScenario.technique}
                </div>
              )}

              <button
                onClick={continueGame}
                style={{
                  width: '100%',
                  background: '#8b5cf6',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '1.5rem'
                }}
              >
                {scenariosCompleted >= 10 ? '🏆 View Results' : '➡️ Next Scenario'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // RESULT SCREEN
  if (gameState === 'result') {
    const badge = getLevelBadge()
    const accuracy = Math.round((score / (scenariosCompleted * 30)) * 100)

    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)',
        color: 'white',
        minHeight: '100vh',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>{badge.icon}</div>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem', color: badge.color }}>
            {badge.name}
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '3rem' }}>
            Training Completed!
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '0.5rem' }}>
              {score}
            </div>
            <div style={{ color: '#9ca3af', marginBottom: '2rem' }}>Total Score</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{accuracy}%</div>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Accuracy</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{level}</div>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Level Reached</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(139, 92, 246, 0.2)',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>📚 Training Summary:</h3>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: '#d1d5db' }}>
              <li>You completed {scenariosCompleted} scenarios</li>
              <li>You reached level {level} difficulty</li>
              <li>Your best streak was {streak} correct answers</li>
              <li>You learned to identify multiple phishing techniques</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={startGame}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔄 Play Again
            </button>
            <button
              onClick={() => setGameState('menu')}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🏠 Main Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
