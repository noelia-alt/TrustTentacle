const express = require('express');
const { body, query, validationResult } = require('express-validator');
const blockchainService = require('../services/blockchain');
const externalAPIs = require('../services/externalAPIs');

const metrics = require('../services/metrics');

const router = express.Router();

/**
 * @route POST /api/v1/verify
 * @desc Verify if a URL/domain is safe using multiple tentacles
 * @access Public
 */
router.post('/', [
  body('url').isURL().withMessage('Valid URL required'),
  body('checkLevel').optional().isIn(['basic', 'full']).withMessage('Check level must be basic or full')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { url, checkLevel = 'basic' } = req.body;
    const startTime = Date.now();
    
    console.log(`ðŸ” Verifying URL: ${url} (level: ${checkLevel})`);

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
      recommendations: []
    };

    // Tentacle 1: Blockchain Domain Registry Check
    try {
      console.log('ðŸ™ Tentacle 1: Checking blockchain registry...');
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

    // Tentacle 2: Phishing Reports Check
    try {
      console.log('ðŸ™ Tentacle 2: Checking phishing reports...');
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
      } else if (phishingCheck.isReported) {
        result.warnings.push(`This URL has ${phishingCheck.reportCount} community report(s)`);
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
      try {
        console.log('ðŸ™ Tentacle 3: Checking external threat intelligence...');
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
        }
      } catch (error) {
        console.error('Tentacle 3 error:', error);
        result.tentacles.externalAPIs = {
          name: 'Threat Intelligence',
          status: 'error',
          error: error.message
        };
      }

      // Tentacle 4: AI Phishing Detection ðŸ§ 
      try {
        console.log('ðŸ™ Tentacle 4: AI phishing detection...');
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
          
          // Add AI explanation for user education
          if (aiAnalysis.userExplanation) {
            result.aiExplanation = aiAnalysis.userExplanation;
          }
        } else if (aiAnalysis.flags.length > 0) {
          result.warnings.push(`AI detected ${aiAnalysis.flags.length} potential risk indicators`);
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
        console.log('ðŸ™ Tentacle 5: Analyzing SSL certificate...');
        const sslCheck = await externalAPIs.checkSSL(domain);
        
        result.tentacles.ssl = {
          name: 'SSL Analysis',
          status: 'completed',
          ...sslCheck
        };

        if (sslCheck.hasIssues) {
          result.warnings.push(...sslCheck.issues);
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
    }

    const processingTime = Date.now() - startTime;
    result.processingTimeMs = processingTime;
    
    console.log(`âœ… Verification completed in ${processingTime}ms - Verdict: ${result.verdict}`);

    try { metrics.record('verify'); metrics.record(erify_); } catch {}\n\n    res.json(result);

  } catch (error) {
    console.error('âŒ Verification error:', error);
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

    try { metrics.record('verify'); metrics.record(erify_); } catch {}\n\n    res.json(result);

  } catch (error) {
    console.error('âŒ Domain verification error:', error);
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
    console.error('âŒ Batch verification error:', error);
    res.status(500).json({
      error: 'Batch verification failed',
      message: error.message
    });
  }
});

module.exports = router;



