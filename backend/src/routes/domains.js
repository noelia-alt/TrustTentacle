const express = require('express');
const { query } = require('express-validator');
const blockchainService = require('../services/blockchain');

const router = express.Router();

/**
 * @route GET /api/v1/domains
 * @desc Get list of verified domains
 * @access Public
 */
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('entityId').optional().isNumeric().withMessage('Entity ID must be numeric')
], async (req, res) => {
  try {
    const { limit = 50, offset = 0, entityId } = req.query;

    // Static domain data for demo
    const allDomains = [
      {
        domain: 'bancogalicia.com.ar',
        entityId: '1',
        entityName: 'Banco Galicia',
        isActive: true,
        addedAt: '2024-10-01T00:00:00.000Z',
        category: 'banking'
      },
      {
        domain: 'onlinebanking.bancogalicia.com.ar',
        entityId: '1', 
        entityName: 'Banco Galicia',
        isActive: true,
        addedAt: '2024-10-01T00:00:00.000Z',
        category: 'banking'
      },
      {
        domain: 'bbva.com.ar',
        entityId: '2',
        entityName: 'BBVA Argentina',
        isActive: true,
        addedAt: '2024-10-01T00:00:00.000Z',
        category: 'banking'
      },
      {
        domain: 'net.bbva.com.ar',
        entityId: '2',
        entityName: 'BBVA Argentina', 
        isActive: true,
        addedAt: '2024-10-01T00:00:00.000Z',
        category: 'banking'
      },
      {
        domain: 'mercadopago.com.ar',
        entityId: '3',
        entityName: 'Mercado Pago',
        isActive: true,
        addedAt: '2024-10-01T00:00:00.000Z',
        category: 'fintech'
      },
      {
        domain: 'mercadopago.com',
        entityId: '3',
        entityName: 'Mercado Pago',
        isActive: true,
        addedAt: '2024-10-01T00:00:00.000Z',
        category: 'fintech'
      },
      {
        domain: 'uala.com.ar',
        entityId: '4',
        entityName: 'Ualá',
        isActive: true,
        addedAt: '2024-10-01T00:00:00.000Z',
        category: 'fintech'
      }
    ];

    // Filter by entityId if specified
    let filteredDomains = entityId 
      ? allDomains.filter(domain => domain.entityId === entityId)
      : allDomains;

    // Apply pagination
    const paginatedDomains = filteredDomains.slice(offset, offset + parseInt(limit));

    res.json({
      domains: paginatedDomains,
      pagination: {
        total: filteredDomains.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + parseInt(limit) < filteredDomains.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching domains:', error);
    res.status(500).json({
      error: 'Failed to fetch domains',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/domains/search
 * @desc Search domains
 * @access Public
 */
router.get('/search', [
  query('q').isLength({ min: 2 }).withMessage('Query must be at least 2 characters'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;

    // Static search for demo
    const allDomains = [
      'bancogalicia.com.ar',
      'onlinebanking.bancogalicia.com.ar', 
      'bbva.com.ar',
      'net.bbva.com.ar',
      'mercadopago.com.ar',
      'mercadopago.com',
      'uala.com.ar'
    ];

    const searchResults = allDomains
      .filter(domain => 
        domain.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, parseInt(limit))
      .map(domain => ({
        domain,
        isOfficial: true,
        matchType: domain.startsWith(query.toLowerCase()) ? 'prefix' : 'contains'
      }));

    res.json({
      query,
      results: searchResults,
      count: searchResults.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error searching domains:', error);
    res.status(500).json({
      error: 'Domain search failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/domains/similar/:domain
 * @desc Find domains similar to the given domain (potential typosquatting)
 * @access Public
 */
router.get('/similar/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    
    if (!domain || domain.length < 3) {
      return res.status(400).json({
        error: 'Invalid domain',
        message: 'Domain must be at least 3 characters'
      });
    }

    // Simple similarity check for demo
    const officialDomains = [
      'bancogalicia.com.ar',
      'bbva.com.ar', 
      'mercadopago.com.ar',
      'uala.com.ar'
    ];

    const similarDomains = [];
    
    officialDomains.forEach(officialDomain => {
      const similarity = calculateSimilarity(domain.toLowerCase(), officialDomain);
      if (similarity > 0.6 && similarity < 1.0) {
        similarDomains.push({
          domain: officialDomain,
          similarity: Math.round(similarity * 100),
          isOfficial: true,
          warning: `This domain is similar to the official domain: ${officialDomain}`
        });
      }
    });

    // Sort by similarity
    similarDomains.sort((a, b) => b.similarity - a.similarity);

    res.json({
      inputDomain: domain,
      similarDomains: similarDomains.slice(0, 5), // Top 5 matches
      count: similarDomains.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error finding similar domains:', error);
    res.status(500).json({
      error: 'Similar domain search failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/domains/validate/:domain
 * @desc Validate domain format and check for suspicious patterns
 * @access Public
 */
router.get('/validate/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    
    const validation = {
      domain,
      isValid: true,
      issues: [],
      suspicionScore: 0,
      recommendations: []
    };

    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!domainRegex.test(domain)) {
      validation.isValid = false;
      validation.issues.push('Invalid domain format');
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      { pattern: /\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}/, message: 'Contains IP-like pattern', score: 30 },
      { pattern: /[0-9]{5,}/, message: 'Contains long number sequence', score: 20 },
      { pattern: /(.)\1{3,}/, message: 'Contains repeated characters', score: 25 },
      { pattern: /-{2,}/, message: 'Contains multiple consecutive hyphens', score: 15 },
      { pattern: /\.(tk|ml|ga|cf)$/, message: 'Uses suspicious TLD', score: 40 }
    ];

    suspiciousPatterns.forEach(({ pattern, message, score }) => {
      if (pattern.test(domain)) {
        validation.issues.push(message);
        validation.suspicionScore += score;
      }
    });

    // Domain length check
    if (domain.length > 50) {
      validation.issues.push('Unusually long domain name');
      validation.suspicionScore += 15;
    }

    // Subdomain count check
    const subdomainCount = domain.split('.').length - 2;
    if (subdomainCount > 3) {
      validation.issues.push('Excessive subdomain levels');
      validation.suspicionScore += 10;
    }

    // Generate recommendations
    if (validation.suspicionScore > 40) {
      validation.recommendations.push('Exercise extreme caution with this domain');
      validation.recommendations.push('Verify the URL manually before proceeding');
    } else if (validation.suspicionScore > 20) {
      validation.recommendations.push('This domain shows some suspicious characteristics');
      validation.recommendations.push('Double-check the spelling and legitimacy');
    }

    validation.suspicionScore = Math.min(validation.suspicionScore, 100);
    validation.riskLevel = validation.suspicionScore > 40 ? 'HIGH' : 
                          validation.suspicionScore > 20 ? 'MEDIUM' : 'LOW';

    res.json({
      validation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error validating domain:', error);
    res.status(500).json({
      error: 'Domain validation failed',
      message: error.message
    });
  }
});

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1, str2) {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return (maxLen - matrix[len1][len2]) / maxLen;
}

module.exports = router;
