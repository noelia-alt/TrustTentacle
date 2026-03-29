const express = require('express');
const { body, validationResult } = require('express-validator');
const blockchainService = require('../services/blockchain');
const externalAPIs = require('../services/externalAPIs');
const aiDetection = require('../services/aiDetection');

const metrics = require('../services/metrics');

const router = express.Router();

const SEVERITY_RANK = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

function pushRiskIndicator(list, severity, title, detail, source) {
  const normalizedTitle = String(title || '').trim();
  if (!normalizedTitle) return;

  const exists = list.some((item) => item.title === normalizedTitle && item.detail === detail);
  if (exists) return;

  list.push({
    severity,
    title: normalizedTitle,
    detail: detail || '',
    source: source || 'analysis'
  });
}

function finalizeRiskIndicators(list) {
  return list
    .sort((a, b) => (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0))
    .slice(0, 4);
}

/**
 * @route POST /api/v1/verify
 * @desc Verify if a URL/domain is safe using multiple tentacles
 * @access Public
 */
router.post('/', [
  body('url').isURL().withMessage('Valid URL required'),
  body('checkLevel').optional().isIn(['basic', 'full']).withMessage('Check level must be basic or full'),
  body('domSignals').optional().isObject().withMessage('domSignals must be an object'),
  body('pageContext').optional().isObject().withMessage('pageContext must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { url, checkLevel = 'basic', domSignals = {}, pageContext = {} } = req.body;
    const startTime = Date.now();
    const riskIndicators = [];
    
    console.log(`🔍 Verifying URL: ${url} (level: ${checkLevel})`);

    // Extract domain from URL
    let domain;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid URL format',
        message: 'Could not parse the provided URL'
      });
    }

    const result = {
      url,
      domain,
      timestamp: new Date().toISOString(),
      checkLevel,
      tentacles: {},
      verdict: 'UNKNOWN',
      confidence: 0,
      warnings: [],
      recommendations: [],
      riskIndicators: [],
      analysisContext: {
        domSignalsProcessed: Object.keys(domSignals).length > 0,
        pageContextProcessed: Object.keys(pageContext).length > 0
      }
    };

    // Tentacle 1: Blockchain Domain Registry Check
    try {
      console.log('Tentacle 1: Checking blockchain registry...');
      const domainCheck = await blockchainService.isDomainOfficial(domain);
      console.log('Domain check result:', domainCheck);
      
      result.tentacles.blockchain = {
        name: 'Blockchain Registry',
        status: 'completed',
        isOfficial: domainCheck.isOfficial,
        entityId: domainCheck.entityId,
        confidence: domainCheck.isOfficial ? 95 : 0,
        source: domainCheck.source || 'blockchain',
        category: domainCheck.category
      };

      if (domainCheck.isOfficial) {
        // Use mock entity name or try to get from blockchain
        if (domainCheck.source === 'mock') {
          result.tentacles.blockchain.entity = {
            name: domainCheck.entityId,
            domain: domain,
            verified: true
          };
          result.verdict = 'SAFE';
          result.confidence = domainCheck.confidence || 95;
        } else {
          // Get entity info from blockchain
          const entityInfo = await blockchainService.getEntityInfo(domainCheck.entityId);
          result.tentacles.blockchain.entity = entityInfo;
          result.verdict = 'SAFE';
          result.confidence = 95;
        }
      }
    } catch (error) {
      console.error('Tentacle 1 error:', error);
      result.tentacles.blockchain = {
        name: 'Blockchain Registry',
        status: 'error',
        error: error.message
      };
    }
    
    // Demo Tentacle: Heuristic checks (no external APIs)
    try {
      const urlObj = new URL(url);
      const host = (domain || urlObj.hostname || '').toLowerCase();
      const path = (urlObj.pathname || '').toLowerCase();
      const badTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq'];
      const riskyKeywords = /(login|verify|secure|account|update|billing|wallet|passcode)/i;
      const looksTyposquatting = /(0|1|3|5|7)[a-z]|[a-z](0|1|3|5|7)/i.test(host) || /00/.test(host);
      const hasBadTld = badTLDs.some(t => host.endsWith(t));
      const hasRiskyKeyword = riskyKeywords.test(host) || riskyKeywords.test(path);

      let demoVerdict = null;
      let demoConfidence = 0;
      const demoWarnings = [];
      if (hasBadTld || (hasRiskyKeyword && looksTyposquatting)) {
        demoVerdict = 'DANGEROUS';
        demoConfidence = 85;
      } else if (hasRiskyKeyword || looksTyposquatting) {
        demoVerdict = 'SUSPICIOUS';
        demoConfidence = 65;
      }
      if (hasBadTld) demoWarnings.push('Suspicious TLD often used for phishing');
      if (hasRiskyKeyword) demoWarnings.push('Sensitive-action keywords detected in URL');
      if (looksTyposquatting) demoWarnings.push('Possible typosquatting');

      if (hasBadTld) {
        pushRiskIndicator(
          riskIndicators,
          'HIGH',
          'Suspicious TLD',
          'This domain uses a TLD commonly abused in phishing infrastructure.',
          'heuristic'
        );
      }
      if (hasRiskyKeyword && looksTyposquatting) {
        pushRiskIndicator(
          riskIndicators,
          'HIGH',
          'Brand impersonation pattern',
          'Sensitive-action keywords and typosquatting patterns were detected in the URL.',
          'heuristic'
        );
      } else if (looksTyposquatting) {
        pushRiskIndicator(
          riskIndicators,
          'MEDIUM',
          'Possible typosquatting',
          'The hostname resembles a legitimate brand with character substitutions.',
          'heuristic'
        );
      } else if (hasRiskyKeyword) {
        pushRiskIndicator(
          riskIndicators,
          'MEDIUM',
          'Sensitive action keywords',
          'The URL contains terms often used in credential or payment collection flows.',
          'heuristic'
        );
      }

      if (!result.tentacles.blockchain?.isOfficial) {
        if ((domSignals.passwordFields || 0) > 0 || pageContext.hasLoginForm) {
          pushRiskIndicator(
            riskIndicators,
            'HIGH',
            'Credential collection form',
            'This page contains login or password fields on a non-verified domain.',
            'dom'
          );
        }
        if ((domSignals.cardLikeFields || 0) > 0 || (domSignals.seedPhraseFields || 0) > 0) {
          pushRiskIndicator(
            riskIndicators,
            'HIGH',
            'Sensitive financial fields',
            'Inputs related to card data or recovery phrases were detected on the page.',
            'dom'
          );
        }
        if ((domSignals.walletButtons || 0) > 0 || pageContext.hasWalletLanguage) {
          pushRiskIndicator(
            riskIndicators,
            'MEDIUM',
            'Wallet interaction entry points',
            'Connect, sign or claim wallet actions are present on this page.',
            'dom'
          );
        }
      }

      result.tentacles.demoHeuristics = {
        name: 'Heuristic Analysis',
        status: 'completed',
        hasBadTld,
        hasRiskyKeyword,
        looksTyposquatting,
        confidence: demoConfidence
      };
      if (demoVerdict === 'DANGEROUS') {
        result.verdict = 'DANGEROUS';
        result.confidence = Math.max(result.confidence, demoConfidence);
      } else if (demoVerdict === 'SUSPICIOUS' && (result.verdict === 'UNKNOWN' || result.verdict === 'UNVERIFIED')) {
        result.verdict = 'SUSPICIOUS';
        result.confidence = Math.max(result.confidence, demoConfidence);
      }
      result.warnings.push(...demoWarnings);
    } catch (error) {
      result.tentacles.demoHeuristics = { name: 'Heuristic Analysis', status: 'error', error: error.message };
    }

    // Tentacle 2: Phishing Reports Check
    try {
      console.log('Tentacle 2: Checking phishing reports...');
      const phishingCheck = await blockchainService.checkPhishingReports(url);
      
      result.tentacles.phishingReports = {
        name: 'Community Reports',
        status: 'completed',
        isReported: phishingCheck.isReported,
        reportCount: parseInt(phishingCheck.reportCount),
        isBlacklisted: phishingCheck.isBlacklisted,
        confidence: phishingCheck.isBlacklisted ? 90 : (phishingCheck.isReported ? 70 : 0)
      };

      if (phishingCheck.isBlacklisted) {
        result.verdict = 'DANGEROUS';
        result.confidence = Math.max(result.confidence, 90);
        result.warnings.push('This URL has been reported multiple times for phishing');
        pushRiskIndicator(
          riskIndicators,
          'HIGH',
          'Community phishing reports',
          'This URL has reached the blacklist threshold in community reporting.',
          'community'
        );
      } else if (phishingCheck.isReported) {
        result.warnings.push(`This URL has ${phishingCheck.reportCount} community report(s)`);
        pushRiskIndicator(
          riskIndicators,
          'MEDIUM',
          'Community risk reports',
          `The community has submitted ${phishingCheck.reportCount} report(s) for this URL.`,
          'community'
        );
      }
    } catch (error) {
      console.error('Tentacle 2 error:', error);
      result.tentacles.phishingReports = {
        name: 'Community Reports',
        status: 'error',
        error: error.message
      };
    }

    // Tentacle 3: External APIs (if full check requested)
    if (checkLevel === 'full') {
      const hasThreatApiKeys = !!(externalAPIs.virusTotalApiKey || externalAPIs.safeBrowsingApiKey);
      if (!hasThreatApiKeys) {
        result.tentacles.externalAPIs = {
          name: 'Threat Intelligence',
          status: 'skipped',
          reason: 'No external threat API keys configured'
        };
      } else {
        try {
          console.log('Tentacle 3: Checking external threat intelligence...');
          const externalCheck = await externalAPIs.checkURL(url);
          
          result.tentacles.externalAPIs = {
            name: 'Threat Intelligence',
            status: 'completed',
            ...externalCheck
          };

          if (externalCheck.isMalicious) {
            result.verdict = 'DANGEROUS';
            result.confidence = Math.max(result.confidence, externalCheck.confidence || 80);
            result.warnings.push('Detected as malicious by external threat intelligence');
            pushRiskIndicator(
              riskIndicators,
              'HIGH',
              'Threat intelligence hit',
              'An external threat feed classified this URL as malicious.',
              'threat_intel'
            );
          }
        } catch (error) {
          console.error('Tentacle 3 error:', error);
          result.tentacles.externalAPIs = {
            name: 'Threat Intelligence',
            status: 'error',
            error: error.message
          };
        }
      }

      // Tentacle 4: AI Phishing Detection 🧠
      try {
        console.log('Tentacle 4: AI phishing detection...');
        const aiAnalysis = await aiDetection.detectPhishing(url);
        
        result.tentacles.aiDetection = {
          name: 'AI Detection',
          status: 'completed',
          isPhishing: aiAnalysis.isPhishing,
          confidence: aiAnalysis.confidence,
          aiScore: aiAnalysis.aiScore,
          flagsDetected: aiAnalysis.flags.length,
          explanation: aiAnalysis.userExplanation
        };

        if (aiAnalysis.isPhishing) {
          result.verdict = 'DANGEROUS';
          result.confidence = Math.max(result.confidence, aiAnalysis.confidence);
          result.warnings.push(...aiAnalysis.explanations);
          pushRiskIndicator(
            riskIndicators,
            'HIGH',
            'Heuristic phishing detection',
            aiAnalysis.userExplanation || 'Multiple phishing indicators were detected during heuristic analysis.',
            'ai'
          );
          
          // Add AI explanation for user education
          if (aiAnalysis.userExplanation) {
            result.aiExplanation = aiAnalysis.userExplanation;
          }
        } else if (aiAnalysis.flags.length > 0) {
          result.warnings.push(`AI detected ${aiAnalysis.flags.length} potential risk indicators`);
          pushRiskIndicator(
            riskIndicators,
            'MEDIUM',
            'Heuristic risk signals',
            `The analysis engine detected ${aiAnalysis.flags.length} risk indicator(s).`,
            'ai'
          );
        }
      } catch (error) {
        console.error('Tentacle 4 error:', error);
        result.tentacles.aiDetection = {
          name: 'AI Detection',
          status: 'error',
          error: error.message
        };
      }

      // Tentacle 5: SSL/Certificate Analysis
      try {
        console.log('Tentacle 5: Analyzing SSL certificate...');
        const sslCheck = await externalAPIs.checkSSL(domain);
        
        result.tentacles.ssl = {
          name: 'SSL Analysis',
          status: 'completed',
          ...sslCheck
        };

        if (sslCheck.hasIssues) {
          result.warnings.push(...sslCheck.issues);
          pushRiskIndicator(
            riskIndicators,
            'MEDIUM',
            'SSL trust issue',
            sslCheck.issues[0] || 'The certificate or connection trust chain is suspicious.',
            'ssl'
          );
        }
      } catch (error) {
        console.error('Tentacle 5 error:', error);
        result.tentacles.ssl = {
          name: 'SSL Analysis',
          status: 'error',
          error: error.message
        };
      }
    }

    // Determine final verdict if not already set
    if (result.verdict === 'UNKNOWN') {
      if (result.confidence === 0) {
        result.verdict = 'UNVERIFIED';
        result.recommendations.push('This site is not in our verified database. Exercise caution.');
      } else if (result.confidence < 50) {
        result.verdict = 'SUSPICIOUS';
        result.recommendations.push('Multiple indicators suggest this site may not be legitimate.');
      }
    }

    // Add general recommendations
    if (result.verdict === 'SAFE') {
      result.recommendations.push('This site is verified as official. Safe to proceed.');
    } else if (result.verdict === 'UNVERIFIED') {
      result.recommendations.push('Verify the URL manually before entering sensitive information.');
      result.recommendations.push('Check for typos in the domain name.');
    } else if (result.verdict === 'SUSPICIOUS' || result.verdict === 'DANGEROUS') {
      result.recommendations.push('Review the risk indicators before entering credentials or connecting a wallet.');
      if ((domSignals.walletButtons || 0) > 0 || pageContext.hasWalletLanguage) {
        result.recommendations.push('Do not connect a wallet or approve transactions on this page.');
      }
    }

    result.riskIndicators = finalizeRiskIndicators(riskIndicators);

    const processingTime = Date.now() - startTime;
    result.processingTimeMs = processingTime;
    
    console.log(`Verification completed in ${processingTime}ms - Verdict: ${result.verdict}`);

    try { metrics.record('verify'); } catch {}
    res.json(result);

  } catch (error) {
    console.error('Domain verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/verify/domain/:domain
 * @desc Quick domain verification
 * @access Public
 */
router.get('/domain/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    
    if (!domain || domain.length === 0) {
      return res.status(400).json({
        error: 'Domain parameter required'
      });
    }

    const domainCheck = await blockchainService.isDomainOfficial(domain);
    
    let result = {
      domain,
      isOfficial: domainCheck.isOfficial,
      timestamp: new Date().toISOString()
    };

    if (domainCheck.isOfficial) {
      const entityInfo = await blockchainService.getEntityInfo(domainCheck.entityId);
      result.entity = entityInfo;
    }

    try { metrics.record('verify'); } catch {}
    res.json(result);

  } catch (error) {
    console.error('Batch verification error:', error);
    res.status(500).json({
      error: 'Domain verification failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/verify/batch
 * @desc Batch domain verification
 * @access Public
 */
router.post('/batch', [
  body('domains').isArray({ min: 1, max: 10 }).withMessage('Domains array required (max 10)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { domains } = req.body;
    const results = [];

    for (const domain of domains) {
      try {
        const domainCheck = await blockchainService.isDomainOfficial(domain);
        let result = {
          domain,
          isOfficial: domainCheck.isOfficial,
          status: 'success'
        };

        if (domainCheck.isOfficial) {
          const entityInfo = await blockchainService.getEntityInfo(domainCheck.entityId);
          result.entity = entityInfo;
        }

        results.push(result);
      } catch (error) {
        results.push({
          domain,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      results,
      timestamp: new Date().toISOString(),
      processed: results.length
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      error: 'Batch verification failed',
      message: error.message
    });
  }
});

module.exports = router;






