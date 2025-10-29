const express = require('express');
const { query } = require('express-validator');
const blockchainService = require('../services/blockchain');

const router = express.Router();

/**
 * @route GET /api/v1/entities
 * @desc Get list of registered entities
 * @access Public
 */
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('country').optional().isLength({ min: 2, max: 2 }).withMessage('Country must be 2-letter code')
], async (req, res) => {
  try {
    const { limit = 20, offset = 0, country } = req.query;

    // For now, we'll return a static list of entities
    // In a full implementation, this would query the blockchain
    const entities = [
      {
        id: '1',
        name: 'Banco Galicia',
        website: 'https://bancogalicia.com.ar',
        country: 'AR',
        isActive: true,
        domainCount: 2,
        createdAt: '2024-10-01T00:00:00.000Z'
      },
      {
        id: '2', 
        name: 'BBVA Argentina',
        website: 'https://bbva.com.ar',
        country: 'AR',
        isActive: true,
        domainCount: 2,
        createdAt: '2024-10-01T00:00:00.000Z'
      },
      {
        id: '3',
        name: 'Mercado Pago',
        website: 'https://mercadopago.com.ar',
        country: 'AR', 
        isActive: true,
        domainCount: 2,
        createdAt: '2024-10-01T00:00:00.000Z'
      },
      {
        id: '4',
        name: 'Ualá',
        website: 'https://uala.com.ar',
        country: 'AR',
        isActive: true,
        domainCount: 1,
        createdAt: '2024-10-01T00:00:00.000Z'
      }
    ];

    // Filter by country if specified
    let filteredEntities = country 
      ? entities.filter(entity => entity.country === country.toUpperCase())
      : entities;

    // Apply pagination
    const paginatedEntities = filteredEntities.slice(offset, offset + parseInt(limit));

    res.json({
      entities: paginatedEntities,
      pagination: {
        total: filteredEntities.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + parseInt(limit) < filteredEntities.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching entities:', error);
    res.status(500).json({
      error: 'Failed to fetch entities',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/entities/:entityId
 * @desc Get specific entity details
 * @access Public
 */
router.get('/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;

    // Try to get entity info from blockchain
    try {
      const entity = await blockchainService.getEntityInfo(entityId);
      
      res.json({
        entity,
        timestamp: new Date().toISOString()
      });
    } catch (blockchainError) {
      // Fallback to static data if blockchain is not available
      const staticEntities = {
        '1': {
          id: '1',
          name: 'Banco Galicia',
          website: 'https://bancogalicia.com.ar',
          country: 'AR',
          isActive: true,
          createdAt: '2024-10-01T00:00:00.000Z',
          updatedAt: '2024-10-01T00:00:00.000Z'
        },
        '2': {
          id: '2',
          name: 'BBVA Argentina', 
          website: 'https://bbva.com.ar',
          country: 'AR',
          isActive: true,
          createdAt: '2024-10-01T00:00:00.000Z',
          updatedAt: '2024-10-01T00:00:00.000Z'
        },
        '3': {
          id: '3',
          name: 'Mercado Pago',
          website: 'https://mercadopago.com.ar',
          country: 'AR',
          isActive: true,
          createdAt: '2024-10-01T00:00:00.000Z',
          updatedAt: '2024-10-01T00:00:00.000Z'
        },
        '4': {
          id: '4',
          name: 'Ualá',
          website: 'https://uala.com.ar',
          country: 'AR',
          isActive: true,
          createdAt: '2024-10-01T00:00:00.000Z',
          updatedAt: '2024-10-01T00:00:00.000Z'
        }
      };

      const entity = staticEntities[entityId];
      if (!entity) {
        return res.status(404).json({
          error: 'Entity not found',
          entityId
        });
      }

      res.json({
        entity,
        timestamp: new Date().toISOString(),
        note: 'Using cached data - blockchain unavailable'
      });
    }

  } catch (error) {
    console.error('❌ Error fetching entity:', error);
    res.status(500).json({
      error: 'Failed to fetch entity',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/entities/:entityId/domains
 * @desc Get domains for a specific entity
 * @access Public
 */
router.get('/:entityId/domains', async (req, res) => {
  try {
    const { entityId } = req.params;

    // Static domain data for demo
    const entityDomains = {
      '1': ['bancogalicia.com.ar', 'onlinebanking.bancogalicia.com.ar'],
      '2': ['bbva.com.ar', 'net.bbva.com.ar'],
      '3': ['mercadopago.com.ar', 'mercadopago.com'],
      '4': ['uala.com.ar']
    };

    const domains = entityDomains[entityId];
    if (!domains) {
      return res.status(404).json({
        error: 'Entity not found or has no domains',
        entityId
      });
    }

    res.json({
      entityId,
      domains: domains.map(domain => ({
        domain,
        isActive: true,
        addedAt: '2024-10-01T00:00:00.000Z'
      })),
      count: domains.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching entity domains:', error);
    res.status(500).json({
      error: 'Failed to fetch entity domains',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/entities/search
 * @desc Search entities by name
 * @access Public
 */
router.get('/search', [
  query('q').isLength({ min: 2 }).withMessage('Query must be at least 2 characters'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    // Static search for demo
    const allEntities = [
      { id: '1', name: 'Banco Galicia', country: 'AR' },
      { id: '2', name: 'BBVA Argentina', country: 'AR' },
      { id: '3', name: 'Mercado Pago', country: 'AR' },
      { id: '4', name: 'Ualá', country: 'AR' }
    ];

    const searchResults = allEntities
      .filter(entity => 
        entity.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, parseInt(limit));

    res.json({
      query,
      results: searchResults,
      count: searchResults.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error searching entities:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

module.exports = router;
