const express = require('express');
const { body, validationResult } = require('express-validator');
const metrics = require('../services/metrics');

const router = express.Router();

const BRAND_PATTERNS = [
  { brand: 'PayPal', pattern: /paypa[l1]/i },
  { brand: 'Microsoft', pattern: /micr[o0]soft/i },
  { brand: 'Amazon', pattern: /amaz[o0]n/i },
  { brand: 'Devpost', pattern: /devp[o0]st/i },
  { brand: 'GitHub', pattern: /git[hb]ub/i }
];

const URGENCY_PATTERN = /(urgent|immediately|action required|verify now|account suspended|final notice|within 24 hours)/i;
const CREDENTIAL_PATTERN = /(verify your identity|confirm your password|reset your password|login now|enter your credentials|wallet recovery|seed phrase)/i;
const PAYMENT_PATTERN = /(wire transfer|gift card|crypto transfer|approve transaction|claim reward|mint now)/i;
const LINK_PATTERN = /https?:\/\/[^\s)>"']+/gi;
const SHORTENER_PATTERN = /(bit\.ly|tinyurl\.com|t\.co|shorturl|goo\.gl)/i;
const SUSPICIOUS_TLD_PATTERN = /\.(tk|ml|ga|cf|gq)(\/|$)/i;

function pushIndicator(list, severity, title, detail, source = 'email') {
  if (!title) return;
  if (list.some((item) => item.title === title && item.detail === detail)) return;
  list.push({ severity, title, detail, source });
}

function normalizeSender(sender = '') {
  const trimmed = String(sender || '').trim();
  const start = trimmed.indexOf('<');
  const end = trimmed.indexOf('>', start + 1);

  if (start !== -1 && end !== -1 && end > start + 1) {
    return trimmed.slice(start + 1, end).trim().toLowerCase();
  }

  return trimmed.toLowerCase();
}

function extractUrls(body = '') {
  return Array.from(new Set(String(body || '').match(LINK_PATTERN) || []));
}

function detectBrandImpersonation(sender, subject, body) {
  const haystack = `${sender} ${subject} ${body}`;
  for (const entry of BRAND_PATTERNS) {
    if (entry.pattern.test(haystack)) {
      return entry.brand;
    }
  }
  return null;
}

router.post('/analyze', [
  body('sender').isLength({ min: 3 }).withMessage('Sender is required'),
  body('subject').isLength({ min: 3 }).withMessage('Subject is required'),
  body('body').isLength({ min: 10 }).withMessage('Email body is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const sender = String(req.body.sender || '').trim();
  const subject = String(req.body.subject || '').trim();
  const body = String(req.body.body || '').trim();

  const normalizedSender = normalizeSender(sender);
  const urls = extractUrls(body);
  const indicators = [];

  let score = 0;

  if (URGENCY_PATTERN.test(`${subject} ${body}`)) {
    score += 28;
    pushIndicator(
      indicators,
      'HIGH',
      'Urgency language detected',
      'The message uses pressure tactics commonly seen in phishing campaigns.'
    );
  }

  if (CREDENTIAL_PATTERN.test(body)) {
    score += 26;
    pushIndicator(
      indicators,
      'HIGH',
      'Credential request language',
      'The message asks the user to log in, verify identity, or provide sensitive secrets.'
    );
  }

  if (PAYMENT_PATTERN.test(body)) {
    score += 24;
    pushIndicator(
      indicators,
      'HIGH',
      'Financial action trigger',
      'The content pushes the user toward a transfer, approval, mint, or payment action.'
    );
  }

  const brand = detectBrandImpersonation(sender, subject, body);
  if (brand) {
    const brandDomain = brand.toLowerCase().replace(/\s+/g, '');
    if (!normalizedSender.includes(brandDomain) || /[01]/.test(normalizedSender)) {
      score += 24;
      pushIndicator(
        indicators,
        'HIGH',
        'Brand impersonation pattern',
        `The sender or message appears to imitate ${brand} using a misleading identity.`
      );
    }
  }

  if (urls.length > 0) {
    score += 10;
    pushIndicator(
      indicators,
      'MEDIUM',
      'Embedded links found',
      `The message contains ${urls.length} clickable link(s) that should be reviewed before opening.`
    );
  }

  if (urls.some((url) => SHORTENER_PATTERN.test(url))) {
    score += 18;
    pushIndicator(
      indicators,
      'HIGH',
      'Shortened link detected',
      'Link shorteners can conceal the final phishing destination.'
    );
  }

  if (urls.some((url) => SUSPICIOUS_TLD_PATTERN.test(url))) {
    score += 18;
    pushIndicator(
      indicators,
      'HIGH',
      'Suspicious phishing infrastructure',
      'At least one link uses a TLD frequently abused in phishing campaigns.'
    );
  }

  if (/reply to this email|do not contact support|act now/i.test(body)) {
    score += 10;
    pushIndicator(
      indicators,
      'MEDIUM',
      'Isolation tactic',
      'The message tries to prevent verification through trusted channels.'
    );
  }

  const riskScore = Math.min(score, 100);
  const verdict = riskScore >= 70 ? 'DANGEROUS' : riskScore >= 35 ? 'SUSPICIOUS' : 'SAFE';

  const recommendations = [];
  if (verdict === 'DANGEROUS') {
    recommendations.push('Do not click any links or approve any transactions from this message.');
    recommendations.push('Verify the sender through an official channel before taking any action.');
  } else if (verdict === 'SUSPICIOUS') {
    recommendations.push('Confirm the sender and destination links before interacting with the email.');
    recommendations.push('Prefer typing the official website manually instead of clicking embedded links.');
  } else {
    recommendations.push('No strong phishing indicators were detected in this sample.');
  }

  try { metrics.record('email_analysis'); } catch {}

  res.json({
    sender,
    subject,
    verdict,
    riskScore,
    suspiciousLinks: urls,
    riskIndicators: indicators.slice(0, 5),
    recommendations,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
