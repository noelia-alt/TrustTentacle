const express = require('express');
const router = express.Router();
const BlockchainService = require('../services/blockchain-mock');

/**
 * @swagger
 * /api/v1/blockchain/verify/{domain}:
 *   get:
 *     summary: Verifica un dominio en la blockchain
 *     tags: [Blockchain]
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         description: Dominio a verificar
 *     responses:
 *       200:
 *         description: Estado del dominio
 */
router.get('/verify/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const result = await BlockchainService.verifyDomain(domain);
    res.json(result);
  } catch (error) {
    console.error('Error verificando dominio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar el dominio',
      isMock: true
    });
  }
});

/**
 * @swagger
 * /api/v1/blockchain/report:
 *   post:
 *     summary: Reporta un dominio como malicioso
 *     tags: [Blockchain]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *             properties:
 *               domain:
 *                 type: string
 *                 description: Dominio a reportar
 *               reporter:
 *                 type: string
 *                 description: Dirección del reportero (opcional)
 *     responses:
 *       200:
 *         description: Resultado del reporte
 */
router.post('/report', async (req, res) => {
  try {
    const { domain, reporter } = req.body;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'El dominio es requerido',
        isMock: true
      });
    }
    
    const result = await BlockchainService.reportDomain(domain, reporter);
    res.json(result);
  } catch (error) {
    console.error('Error reportando dominio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reportar el dominio',
      isMock: true
    });
  }
});

/**
 * @swagger
 * /api/v1/blockchain/tx/{txHash}:
 *   get:
 *     summary: Obtiene el estado de una transacción
 *     tags: [Blockchain]
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash de la transacción
 *     responses:
 *       200:
 *         description: Estado de la transacción
 */
router.get('/tx/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const result = await BlockchainService.getTransactionStatus(txHash);
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo estado de transacción:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el estado de la transacción',
      isMock: true
    });
  }
});

/**
 * @swagger
 * /api/v1/blockchain/stats:
 *   get:
 *     summary: Obtiene estadísticas de la blockchain
 *     tags: [Blockchain]
 *     responses:
 *       200:
 *         description: Estadísticas de la blockchain
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await BlockchainService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      isMock: true
    });
  }
});

/**
 * @swagger
 * /api/v1/blockchain/health:
 *   get:
 *     summary: Verifica el estado del servicio de blockchain
 *     tags: [Blockchain]
 *     responses:
 *       200:
 *         description: Estado del servicio
 */
router.get('/health', async (req, res) => {
  try {
    const isActive = await BlockchainService.isActive();
    res.json({
      success: true,
      status: isActive ? 'active' : 'inactive',
      isMock: true,
      message: 'Servicio de blockchain simulado funcionando correctamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      isMock: true,
      error: 'Error en el servicio de blockchain',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
