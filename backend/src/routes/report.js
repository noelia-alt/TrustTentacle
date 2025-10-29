const express = require('express');
const { body, validationResult } = require('express-validator');
const blockchainService = require('../services/blockchain');
const ipfsService = require('../services/ipfs-mock'); // Using mock for Node.js 22 compatibility

const router = express.Router();

/**
 * @route POST /api/v1/report
 * @desc Report a phishing URL to the community
 * @access Public
 */
router.post('/', [
  body('url').isURL().withMessage('Valid URL required'),
  body('description').isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 characters'),
  body('category').optional().isIn(['phishing', 'malware', 'scam', 'fake_site']).withMessage('Invalid category'),
  body('evidence').optional().isObject().withMessage('Evidence must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { url, description, category = 'phishing', evidence = {} } = req.body;
    const reporterIP = req.ip;
    
    console.log(`🎣 New phishing report for: ${url}`);

    // Prepare metadata for IPFS
    const metadata = {
      url,
      description,
      category,
      evidence,
      reportedAt: new Date().toISOString(),
      reporterIP: reporterIP.replace(/:/g, '_'), // Anonymize but keep for rate limiting
      userAgent: req.get('User-Agent'),
      version: '1.0'
    };

    // Upload metadata to IPFS
    console.log('📤 Uploading report metadata to IPFS...');
    const metadataCID = await ipfsService.uploadJSON(metadata);
    console.log(`✅ Metadata uploaded to IPFS: ${metadataCID}`);

    // Submit report to blockchain
    console.log('⛓️  Submitting report to blockchain...');
    const txResult = await blockchainService.submitPhishingReport(url, metadataCID);
    
    const result = {
      success: true,
      reportId: txResult.reportId || 'pending',
      url,
      category,
      metadataCID,
      transactionHash: txResult.transactionHash,
      blockNumber: txResult.blockNumber,
      timestamp: new Date().toISOString(),
      message: 'Report submitted successfully. Thank you for helping protect the community! 🐙'
    };

    console.log(`✅ Report submitted successfully - TX: ${txResult.transactionHash}`);
    
    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Report submission error:', error);
    
    // Handle specific error types
    if (error.message.includes('Rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Please wait before submitting another report',
        retryAfter: 60
      });
    }

    if (error.message.includes('IPFS')) {
      return res.status(503).json({
        error: 'Storage service unavailable',
        message: 'Unable to store report metadata. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Report submission failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/report/recent
 * @desc Get recent phishing reports
 * @access Public
 */
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const maxLimit = Math.min(parseInt(limit), 50);

    console.log(`📋 Fetching ${maxLimit} recent reports...`);
    
    const reports = await blockchainService.getRecentReports(maxLimit);
    
    // Enhance reports with IPFS metadata
    const enhancedReports = await Promise.all(
      reports.map(async (report) => {
        try {
          const metadata = await ipfsService.getJSON(report.metadataCID);
          return {
            ...report,
            metadata: {
              description: metadata.description,
              category: metadata.category,
              // Don't expose sensitive data like IP
              reportedAt: metadata.reportedAt
            }
          };
        } catch (error) {
          console.error(`Error fetching metadata for report ${report.id}:`, error);
          return {
            ...report,
            metadata: { error: 'Metadata unavailable' }
          };
        }
      })
    );

    res.json({
      reports: enhancedReports,
      count: enhancedReports.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching recent reports:', error);
    res.status(500).json({
      error: 'Failed to fetch reports',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/report/stats
 * @desc Get reporting statistics
 * @access Public
 */
router.get('/stats', async (req, res) => {
  try {
    // This would typically come from a more sophisticated analytics service
    // For now, we'll provide basic stats from the blockchain
    
    const stats = {
      totalReports: 0,
      reportsToday: 0,
      topCategories: {
        phishing: 0,
        malware: 0,
        scam: 0,
        fake_site: 0
      },
      recentActivity: [],
      timestamp: new Date().toISOString()
    };

    // Get recent reports for basic analytics
    const recentReports = await blockchainService.getRecentReports(100);
    stats.totalReports = recentReports.length;

    // Count reports from today
    const today = new Date().toDateString();
    stats.reportsToday = recentReports.filter(report => 
      new Date(report.timestamp).toDateString() === today
    ).length;

    // Activity summary (last 24 hours)
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    stats.recentActivity = recentReports
      .filter(report => new Date(report.timestamp).getTime() > last24h)
      .map(report => ({
        id: report.id,
        timestamp: report.timestamp,
        verified: report.isVerified
      }));

    res.json(stats);

  } catch (error) {
    console.error('❌ Error fetching report stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * @route POST /api/v1/report/verify/:reportId
 * @desc Verify a phishing report (admin/verifier only)
 * @access Private
 */
router.post('/verify/:reportId', [
  body('signature').optional().isString().withMessage('Signature must be a string'),
  body('verifierAddress').optional().isEthereumAddress().withMessage('Invalid Ethereum address')
], async (req, res) => {
  try {
    const { reportId } = req.params;
    const { signature, verifierAddress } = req.body;

    // TODO: Implement proper authentication/authorization
    // For now, this is a placeholder for the verification system
    
    console.log(`🔍 Verifying report ${reportId}...`);

    // This would typically verify the verifier's credentials
    // and then call the blockchain service to verify the report
    
    res.status(501).json({
      error: 'Not implemented',
      message: 'Report verification system is under development',
      reportId
    });

  } catch (error) {
    console.error('❌ Report verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: error.message
    });
  }
});

module.exports = router;
