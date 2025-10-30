const axios = require('axios');
const crypto = require('crypto');

class ExternalAPIsService {
  constructor() {
    this.virusTotalApiKey = process.env.VIRUSTOTAL_API_KEY;
    this.safeBrowsingApiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    this.shodanApiKey = process.env.SHODAN_API_KEY;
  }

  /**
   * Check URL against multiple threat intelligence sources
   */
  async checkURL(url) {
    const results = {
      isMalicious: false,
      confidence: 0,
      sources: {},
      detections: []
    };

    // VirusTotal check
    if (this.virusTotalApiKey) {
      try {
        const vtResult = await this.checkVirusTotal(url);
        results.sources.virusTotal = vtResult;
        
        if (vtResult.malicious > 0) {
          results.isMalicious = true;
          results.confidence = Math.max(results.confidence, 85);
          results.detections.push(`VirusTotal: ${vtResult.malicious}/${vtResult.total} engines detected threats`);
        }
      } catch (error) {
        console.error('VirusTotal API error:', error);
        results.sources.virusTotal = { error: error.message };
      }
    }

    // Google Safe Browsing check
    if (this.safeBrowsingApiKey) {
      try {
        const sbResult = await this.checkSafeBrowsing(url);
        results.sources.safeBrowsing = sbResult;
        
        if (sbResult.isThreat) {
          results.isMalicious = true;
          results.confidence = Math.max(results.confidence, 90);
          results.detections.push(`Safe Browsing: ${sbResult.threatType}`);
        }
      } catch (error) {
        console.error('Safe Browsing API error:', error);
        results.sources.safeBrowsing = { error: error.message };
      }
    }

    return results;
  }

  /**
   * Check URL with VirusTotal
   */
  async checkVirusTotal(url) {
    if (!this.virusTotalApiKey) {
      throw new Error('VirusTotal API key not configured');
    }

    // Strictly validate URL to http(s) and clamp size
    let safeUrl;
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) {
        throw new Error('Only http(s) URLs are allowed');
      }
      if (!u.hostname || u.hostname.length > 255) {
        throw new Error('Invalid hostname');
      }
      // Rebuild a normalized URL without username/password
      u.username = '';
      u.password = '';
      safeUrl = u.toString();
      if (safeUrl.length > 2048) {
        safeUrl = safeUrl.slice(0, 2048);
      }
    } catch (e) {
      throw new Error('Invalid URL for VirusTotal');
    }

    // Use VT submit+analysis flow to avoid placing user input in path
    try {
      const submit = await axios.post(
        'https://www.virustotal.com/api/v3/urls',
        `url=${encodeURIComponent(safeUrl)}`,
        {
          headers: {
            'x-apikey': this.virusTotalApiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      const analysisId = submit?.data?.data?.id;
      if (!analysisId) {
        return { malicious: 0, suspicious: 0, clean: 0, total: 0, status: 'submitted' };
      }

      // Fetch analysis by server-provided id (no user input in path)
      const analysis = await axios.get(
        `https://www.virustotal.com/api/v3/analyses/${encodeURIComponent(analysisId)}`,
        {
          headers: { 'x-apikey': this.virusTotalApiKey },
          timeout: 10000,
          validateStatus: () => true
        }
      );

      if (analysis.status === 200) {
        const attrs = analysis.data?.data?.attributes || {};
        const stats = attrs.last_analysis_stats || {};
        return {
          malicious: stats.malicious || 0,
          suspicious: stats.suspicious || 0,
          clean: stats.harmless || 0,
          total: Object.values(stats).reduce((a, b) => a + b, 0),
          lastAnalysis: attrs.date || attrs.last_analysis_date,
          reputation: attrs.reputation || 0,
          status: attrs.status || 'completed'
        };
      }

      // If still queued or non-200, report submission status
      return {
        malicious: 0,
        suspicious: 0,
        clean: 0,
        total: 0,
        status: 'queued'
      };
    } catch (error) {
      // Fall back to fire-and-forget submit
      try { await this.submitToVirusTotal(safeUrl); } catch {}
      return {
        malicious: 0,
        suspicious: 0,
        clean: 0,
        total: 0,
        status: 'submitted_for_analysis'
      };
    }
  }

  /**
   * Submit URL to VirusTotal for analysis
   */
  async submitToVirusTotal(url) {
    if (!this.virusTotalApiKey) return;

    try {
      await axios.post('https://www.virustotal.com/api/v3/urls', 
        `url=${encodeURIComponent(url)}`,
        {
          headers: {
            'x-apikey': this.virusTotalApiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );
    } catch (error) {
      console.error('Error submitting to VirusTotal:', error);
    }
  }

  /**
   * Check URL with Google Safe Browsing
   */
  async checkSafeBrowsing(url) {
    if (!this.safeBrowsingApiKey) {
      throw new Error('Safe Browsing API key not configured');
    }

    try {
      const response = await axios.post(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${this.safeBrowsingApiKey}`,
        {
          client: {
            clientId: 'trust-tentacles',
            clientVersion: '1.0.0'
          },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION'
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }]
          }
        },
        {
          timeout: 10000
        }
      );

      const matches = response.data.matches || [];
      
      return {
        isThreat: matches.length > 0,
        threatType: matches.length > 0 ? matches[0].threatType : null,
        platformType: matches.length > 0 ? matches[0].platformType : null,
        matches: matches.length
      };
    } catch (error) {
      if (error.response?.status === 200 && !error.response.data.matches) {
        return { isThreat: false, matches: 0 };
      }
      throw error;
    }
  }

  /**
   * Analyze SSL certificate
   */
  async checkSSL(domain) {
    try {
      const results = {
        hasSSL: false,
        isValid: false,
        issuer: null,
        expiresAt: null,
        hasIssues: false,
        issues: []
      };

      // Anti-SSRF validation
      const urlObj = new URL(`https://${domain}`);
      const hostname = urlObj.hostname.toLowerCase();
      const validHostname = /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname);
      // Reject raw IP literals
      const isIPv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
      const isIPv6 = /:/.test(hostname);
      if (!validHostname || isIPv4 || isIPv6) {
        results.issues.push('Invalid host');
        results.hasIssues = true;
        return results;
      }
      if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
        results.issues.push('Refused to check local address');
        results.hasIssues = true;
        return results;
      }

      const dns = require('node:dns').promises;
      try {
        const addrs = await dns.lookup(hostname, { all: true, verbatim: true });
        const isPrivate = (ip) => {
          if (/^(10\.|127\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(ip)) return true;
          if (/^169\.254\./.test(ip)) return true;
          if (ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true;
          return false;
        };
        if (addrs.some(a => isPrivate(a.address))) {
          results.issues.push('Refused to check private address');
          results.hasIssues = true;
          return results;
        }
      } catch (e) {
        results.issues.push('DNS resolution failed');
        results.hasIssues = true;
        return results;
      }

      // HEAD request with tight limits and no redirects
      try {
        const response = await axios.head(`https://${hostname}`, {
          timeout: 6000,
          maxRedirects: 0,
          validateStatus: () => true
        });
        results.hasSSL = true;
        const headers = response.headers || {};
        if (!headers['strict-transport-security']) {
          results.issues.push('Missing HSTS header');
        }
        results.isValid = response.status < 400;
      } catch (error) {
        if (error.code === 'CERT_HAS_EXPIRED') {
          results.hasSSL = true;
          results.issues.push('SSL certificate has expired');
        } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
          results.hasSSL = true;
          results.issues.push('SSL certificate cannot be verified');
        } else if (error.code === 'ENOTFOUND') {
          results.issues.push('Domain not found');
        } else {
          results.issues.push('SSL connection failed');
        }
      }

      results.hasIssues = results.issues.length > 0;
      
      return results;
    } catch (error) {
      return {
        hasSSL: false,
        isValid: false,
        hasIssues: true,
        issues: ['SSL check failed: ' + error.message]
      };
    }
  }

  /**
   * Check domain reputation with Shodan (if available)
   */
  async checkShodan(domain) {
    if (!this.shodanApiKey) {
      throw new Error('Shodan API key not configured');
    }

    try {
      const response = await axios.get(`https://api.shodan.io/dns/domain/${domain}`, {
        params: {
          key: this.shodanApiKey
        },
        timeout: 10000
      });

      return {
        hasData: true,
        subdomains: response.data.subdomains?.length || 0,
        tags: response.data.tags || [],
        data: response.data
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return { hasData: false };
      }
      throw error;
    }
  }

  /**
   * Analyze domain for suspicious patterns
   */
  analyzeDomainPatterns(domain) {
    const suspiciousPatterns = [
      /\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}/, // IP-like patterns
      /[0-9]{5,}/, // Long number sequences
      /(.)\1{3,}/, // Repeated characters
      /-{2,}/, // Multiple hyphens
      /[a-z][A-Z]/, // Mixed case (unusual for domains)
      /\.(tk|ml|ga|cf)$/, // Suspicious TLDs
    ];

    const homographAttacks = [
      /[а-я]/, // Cyrillic characters
      /[α-ω]/, // Greek characters
      /[０-９]/, // Full-width numbers
    ];

    const issues = [];
    let suspicionScore = 0;

    // Check for suspicious patterns
    suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(domain)) {
        suspicionScore += 20;
        issues.push(`Suspicious pattern detected (${index + 1})`);
      }
    });

    // Check for homograph attacks
    homographAttacks.forEach((pattern, index) => {
      if (pattern.test(domain)) {
        suspicionScore += 30;
        issues.push(`Potential homograph attack (${index + 1})`);
      }
    });

    // Check domain length
    if (domain.length > 50) {
      suspicionScore += 15;
      issues.push('Unusually long domain name');
    }

    // Check for excessive subdomains
    const subdomainCount = domain.split('.').length - 2;
    if (subdomainCount > 3) {
      suspicionScore += 10;
      issues.push('Excessive subdomain levels');
    }

    return {
      suspicionScore: Math.min(suspicionScore, 100),
      issues,
      isSuspicious: suspicionScore > 40
    };
  }
}

module.exports = new ExternalAPIsService();
