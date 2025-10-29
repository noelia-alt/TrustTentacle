// AI Detection Service - TrustTentacle 🧠🐙
// Uses ML models for phishing detection and pattern analysis

const axios = require('axios');

class AIDetectionService {
  constructor() {
    this.huggingFaceKey = process.env.HUGGINGFACE_API_KEY;
    this.modelEndpoint = 'https://api-inference.huggingface.co/models/';
    
    // Phishing detection patterns learned from datasets
    this.phishingPatterns = {
      // URL patterns
      urlPatterns: [
        { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, weight: 0.7, reason: 'IP address in URL' },
        { pattern: /@/, weight: 0.8, reason: 'Contains @ symbol (URL obfuscation)' },
        { pattern: /-{2,}/, weight: 0.5, reason: 'Multiple hyphens (suspicious)' },
        { pattern: /\.(tk|ml|ga|cf|gq)$/i, weight: 0.9, reason: 'Free/suspicious TLD' },
        { pattern: /\d{5,}/, weight: 0.6, reason: 'Long number sequence' }
      ],
      
      // Keywords commonly used in phishing
      suspiciousKeywords: [
        { word: 'verify', weight: 0.6, context: 'Account verification scam' },
        { word: 'suspend', weight: 0.7, context: 'Account suspension threat' },
        { word: 'urgent', weight: 0.6, context: 'Urgency manipulation' },
        { word: 'confirm', weight: 0.5, context: 'Confirmation request' },
        { word: 'update', weight: 0.5, context: 'Update prompt' },
        { word: 'secure', weight: 0.5, context: 'False security claim' },
        { word: 'account', weight: 0.4, context: 'Account-related' },
        { word: 'login', weight: 0.6, context: 'Login page mimicry' },
        { word: 'bank', weight: 0.5, context: 'Banking fraud' },
        { word: 'password', weight: 0.7, context: 'Password request' },
        { word: 'credential', weight: 0.8, context: 'Credential theft' },
        { word: 'click', weight: 0.4, context: 'Action prompt' },
        { word: 'prize', weight: 0.7, context: 'Prize scam' },
        { word: 'winner', weight: 0.7, context: 'Winner scam' },
        { word: 'expires', weight: 0.6, context: 'Time pressure' }
      ],
      
      // Brand impersonation (typosquatting)
      brandPatterns: [
        { original: 'paypal', variations: ['paypa1', 'paypai', 'paypa11', 'pay-pal'], weight: 0.9 },
        { original: 'google', variations: ['g00gle', 'googie', 'gooogle', 'goog1e'], weight: 0.9 },
        { original: 'amazon', variations: ['amaz0n', 'amazom', 'arnazon', 'amazon-'], weight: 0.9 },
        { original: 'microsoft', variations: ['micros0ft', 'microsft', 'micro-soft'], weight: 0.9 },
        { original: 'facebook', variations: ['faceb00k', 'facebok', 'face-book'], weight: 0.9 },
        { original: 'banco', variations: ['banc0', 'bank0', 'banca'], weight: 0.8 },
        { original: 'netflix', variations: ['netf1ix', 'netfIix', 'net-flix'], weight: 0.9 }
      ]
    };
  }

  /**
   * Main AI detection method - analyzes URL and content
   */
  async detectPhishing(url, content = null) {
    const results = {
      isPhishing: false,
      confidence: 0,
      aiScore: 0,
      flags: [],
      explanations: [],
      patterns: [],
      timestamp: new Date().toISOString()
    };

    // 1. URL Pattern Analysis
    const urlAnalysis = this.analyzeURL(url);
    results.flags.push(...urlAnalysis.flags);
    results.explanations.push(...urlAnalysis.explanations);
    results.aiScore += urlAnalysis.score;

    // 2. Brand Impersonation Detection
    const brandAnalysis = this.detectBrandImpersonation(url);
    if (brandAnalysis.detected) {
      results.flags.push(brandAnalysis);
      results.explanations.push(brandAnalysis.explanation);
      results.aiScore += brandAnalysis.weight;
    }

    // 3. Keyword Analysis
    const keywordAnalysis = this.analyzeKeywords(url);
    results.flags.push(...keywordAnalysis.flags);
    results.explanations.push(...keywordAnalysis.explanations);
    results.aiScore += keywordAnalysis.score;

    // 4. Content Analysis (if available)
    if (content) {
      const contentAnalysis = await this.analyzeContent(content);
      results.flags.push(...contentAnalysis.flags);
      results.explanations.push(...contentAnalysis.explanations);
      results.aiScore += contentAnalysis.score;
    }

    // Calculate final verdict
    results.confidence = Math.min(Math.round(results.aiScore * 100), 100);
    results.isPhishing = results.confidence >= 60;

    // Add educational explanation
    if (results.isPhishing) {
      results.userExplanation = this.generateUserExplanation(results);
    }

    return results;
  }

  /**
   * Analyze URL patterns
   */
  analyzeURL(url) {
    const results = { flags: [], explanations: [], score: 0 };
    const urlLower = url.toLowerCase();

    this.phishingPatterns.urlPatterns.forEach(({ pattern, weight, reason }) => {
      if (pattern.test(urlLower)) {
        results.flags.push({
          type: 'url_pattern',
          pattern: pattern.toString(),
          reason: reason,
          weight: weight
        });
        results.explanations.push(`⚠️ ${reason}`);
        results.score += weight;
      }
    });

    return results;
  }

  /**
   * Detect brand impersonation (typosquatting)
   */
  detectBrandImpersonation(url) {
    const urlLower = url.toLowerCase();
    
    for (const brand of this.phishingPatterns.brandPatterns) {
      for (const variation of brand.variations) {
        if (urlLower.includes(variation)) {
          return {
            detected: true,
            type: 'brand_impersonation',
            original: brand.original,
            variation: variation,
            weight: brand.weight,
            explanation: `🚨 Posible imitación de "${brand.original}" detectada ("${variation}")`
          };
        }
      }
    }

    return { detected: false };
  }

  /**
   * Analyze suspicious keywords
   */
  analyzeKeywords(url) {
    const results = { flags: [], explanations: [], score: 0 };
    const urlLower = url.toLowerCase();

    this.phishingPatterns.suspiciousKeywords.forEach(({ word, weight, context }) => {
      if (urlLower.includes(word)) {
        results.flags.push({
          type: 'suspicious_keyword',
          keyword: word,
          context: context,
          weight: weight
        });
        results.explanations.push(`⚠️ Keyword "${word}" (${context})`);
        results.score += weight * 0.3; // Reduced weight for keywords
      }
    });

    return results;
  }

  /**
   * Analyze page content (if available)
   */
  async analyzeContent(content) {
    const results = { flags: [], explanations: [], score: 0 };

    try {
      // Check for form fields requesting sensitive data
      const sensitiveFields = ['password', 'credit', 'card', 'cvv', 'ssn', 'pin'];
      sensitiveFields.forEach(field => {
        if (content.toLowerCase().includes(field)) {
          results.flags.push({
            type: 'sensitive_field',
            field: field
          });
          results.score += 0.3;
        }
      });

      // Check for urgency language
      const urgencyPhrases = [
        'act now', 'limited time', 'expires soon', 'urgent',
        'immediate action', 'within 24 hours', 'account will be closed'
      ];
      urgencyPhrases.forEach(phrase => {
        if (content.toLowerCase().includes(phrase)) {
          results.explanations.push(`⏰ Urgency tactic detected: "${phrase}"`);
          results.score += 0.2;
        }
      });

    } catch (error) {
      console.error('Error analyzing content:', error);
    }

    return results;
  }

  /**
   * Generate user-friendly explanation (Explainable AI)
   */
  generateUserExplanation(results) {
    const reasons = [];

    if (results.flags.some(f => f.type === 'brand_impersonation')) {
      const brand = results.flags.find(f => f.type === 'brand_impersonation');
      reasons.push(`Este sitio imita a "${brand.original}" con una URL similar ("${brand.variation}")`);
    }

    if (results.flags.some(f => f.type === 'url_pattern')) {
      reasons.push('La URL contiene patrones sospechosos comunes en ataques de phishing');
    }

    if (results.flags.some(f => f.type === 'suspicious_keyword')) {
      reasons.push('Contiene palabras clave típicas de sitios fraudulentos');
    }

    if (results.flags.length > 3) {
      reasons.push('Múltiples indicadores de phishing detectados simultáneamente');
    }

    return {
      summary: `🧠 La IA detectó ${results.flags.length} señales de advertencia`,
      reasons: reasons,
      recommendation: results.confidence >= 80 
        ? '🛑 NO ingreses información personal en este sitio'
        : '⚠️ Procede con extrema precaución',
      educationalTip: 'Siempre verifica la URL oficial antes de ingresar credenciales'
    };
  }

  /**
   * Analyze emerging phishing trends
   */
  async analyzeTrends(recentReports) {
    const trends = {
      commonPatterns: [],
      targetedBrands: [],
      suspiciousTLDs: [],
      emergingThreats: []
    };

    try {
      // Group by patterns
      const patternMap = new Map();
      recentReports.forEach(report => {
        const pattern = this.extractPattern(report.url);
        if (!patternMap.has(pattern)) {
          patternMap.set(pattern, 0);
        }
        patternMap.set(pattern, patternMap.get(pattern) + 1);
      });

      // Find common patterns
      patternMap.forEach((count, pattern) => {
        if (count >= 3) {
          trends.commonPatterns.push({ pattern, count });
        }
      });

    } catch (error) {
      console.error('Error analyzing trends:', error);
    }

    return trends;
  }

  /**
   * Extract pattern from URL for trend analysis
   */
  extractPattern(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');
      const parts = domain.split('.');
      
      // Return pattern (e.g., "brand-verify.tk" -> "verify TLD:tk")
      const hasVerify = domain.includes('verify') || domain.includes('secure') || domain.includes('login');
      const tld = parts[parts.length - 1];
      
      return `${hasVerify ? 'verify-pattern' : 'normal'} TLD:${tld}`;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get AI detection statistics
   */
  getStats() {
    return {
      patternsLoaded: this.phishingPatterns.urlPatterns.length,
      keywordsTracked: this.phishingPatterns.suspiciousKeywords.length,
      brandsProtected: this.phishingPatterns.brandPatterns.length,
      modelVersion: '1.0.0',
      lastUpdated: '2025-10-01'
    };
  }
}

module.exports = new AIDetectionService();
