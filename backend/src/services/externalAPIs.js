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

    // Create URL ID for VirusTotal
    const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
    
    try {
      const response = await axios.get(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
        headers: {
          'x-apikey': this.virusTotalApiKey
        },
        timeout: 10000
      });

      const data = response.data.data.attributes;
      const stats = data.last_analysis_stats;

      return {
        malicious: stats.malicious || 0,
        suspicious: stats.suspicious || 0,
        clean: stats.harmless || 0,
        total: Object.values(stats).reduce((a, b) => a + b, 0),
        lastAnalysis: data.last_analysis_date,
        reputation: data.reputation || 0
      };
    } catch (error) {
      if (error.response?.status === 404) {
        // URL not found in VirusTotal, submit for analysis
        await this.submitToVirusTotal(url);
        return {
          malicious: 0,
          suspicious: 0,
          clean: 0,
          total: 0,
          status: 'submitted_for_analysis'
        };
      }
      throw error;
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

      // Simple HTTPS check
      try {
        const response = await axios.get(`https://${domain}`, {
          timeout: 10000,
          maxRedirects: 5,
          validateStatus: () => true // Accept any status code
        });

        results.hasSSL = true;
        
        // Check for common SSL issues in headers
        const headers = response.headers;
        
        if (!headers['strict-transport-security']) {
          results.issues.push('Missing HSTS header');
        }
        
        // Check for mixed content warnings
        if (response.config.url.startsWith('https://') && 
            response.data && 
            response.data.includes('http://')) {
          results.issues.push('Potential mixed content detected');
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
