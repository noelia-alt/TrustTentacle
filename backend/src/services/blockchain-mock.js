/**
 * Mock del servicio de blockchain para la demo del hackathon
 * Simula la interacción con un contrato inteligente real
 */

// Datos de demostración
const mockDomains = {
  'paypal.com': {
    isSafe: true,
    reports: 0,
    verified: true,
    verifiedAt: new Date('2025-10-28T12:00:00Z'),
    verifiedBy: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
  },
  'faceb00k-login.com': {
    isSafe: false,
    reports: 15,
    verified: true,
    verifiedAt: new Date('2025-10-29T10:30:00Z'),
    verifiedBy: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
  },
  'bancogalicia.verificacion-segura.com': {
    isSafe: false,
    reports: 8,
    verified: true,
    verifiedAt: new Date('2025-10-29T11:15:00Z'),
    verifiedBy: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
  },
  'meli-pagos-seguros.com': {
    isSafe: false,
    reports: 23,
    verified: true,
    verifiedAt: new Date('2025-10-29T09:45:00Z'),
    verifiedBy: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
  },
  'whatsapp-verify-account.com': {
    isSafe: false,
    reports: 42,
    verified: true,
    verifiedAt: new Date('2025-10-29T08:20:00Z'),
    verifiedBy: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
  }
};

// Simular transacciones pendientes
const pendingTransactions = [];

// Mock del servicio de blockchain
const BlockchainService = {
  /**
   * Verifica si un dominio es seguro
   * @param {string} domain - Dominio a verificar
   * @returns {Promise<Object>} Resultado de la verificación
   */
  async verifyDomain(domain) {
    console.log(`🔍 Verificando dominio en blockchain: ${domain}`);
    
    // Simular tiempo de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const normalizedDomain = domain.toLowerCase().trim();
    const domainInfo = mockDomains[normalizedDomain];
    
    if (domainInfo) {
      return {
        success: true,
        isSafe: domainInfo.isSafe,
        reports: domainInfo.reports,
        verified: domainInfo.verified,
        verifiedAt: domainInfo.verifiedAt,
        verifiedBy: domainInfo.verifiedBy,
        message: domainInfo.isSafe ? 'Dominio verificado como seguro' : '¡Cuidado! Dominio reportado como malicioso',
        source: 'blockchain',
        isMock: true
      };
    }
    
    // Si el dominio no está en la blockchain, asumir que es seguro (por ahora)
    return {
      success: true,
      isSafe: true,
      reports: 0,
      verified: false,
      message: 'Dominio no encontrado en la blockchain',
      source: 'blockchain',
      isMock: true
    };
  },
  
  /**
   * Reporta un dominio como malicioso
   * @param {string} domain - Dominio a reportar
   * @param {string} reporter - Dirección del reportero
   * @returns {Promise<Object>} Resultado del reporte
   */
  async reportDomain(domain, reporter = '0x0000000000000000000000000000000000000000') {
    console.log(`⚠️ Reportando dominio: ${domain}`);
    
    // Simular tiempo de transacción
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const normalizedDomain = domain.toLowerCase().trim();
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    // Crear o actualizar el dominio
    if (!mockDomains[normalizedDomain]) {
      mockDomains[normalizedDomain] = {
        isSafe: false,
        reports: 1,
        verified: false,
        firstReportedAt: new Date(),
        lastReportedAt: new Date(),
        reportedBy: [reporter]
      };
    } else {
      mockDomains[normalizedDomain].reports += 1;
      mockDomains[normalizedDomain].lastReportedAt = new Date();
      if (!mockDomains[normalizedDomain].reportedBy) {
        mockDomains[normalizedDomain].reportedBy = [reporter];
      } else if (!mockDomains[normalizedDomain].reportedBy.includes(reporter)) {
        mockDomains[normalizedDomain].reportedBy.push(reporter);
      }
    }
    
    // Simular transacción pendiente
    const tx = {
      hash: txHash,
      status: 'pending',
      domain: normalizedDomain,
      from: reporter,
      timestamp: new Date(),
      confirmations: 0
    };
    
    pendingTransactions.push(tx);
    
    // Simular confirmación después de 5 segundos
    setTimeout(() => {
      const txIndex = pendingTransactions.findIndex(t => t.hash === txHash);
      if (txIndex > -1) {
        pendingTransactions[txIndex].status = 'confirmed';
        pendingTransactions[txIndex].confirmations = 12;
        console.log(`✅ Transacción confirmada: ${txHash}`);
      }
    }, 5000);
    
    return {
      success: true,
      transactionHash: txHash,
      message: 'Reporte enviado a la blockchain. Esperando confirmaciones...',
      isMock: true
    };
  },
  
  /**
   * Obtiene el estado de una transacción
   * @param {string} txHash - Hash de la transacción
   * @returns {Promise<Object>} Estado de la transacción
   */
  async getTransactionStatus(txHash) {
    // Simular tiempo de red
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tx = pendingTransactions.find(t => t.hash === txHash);
    
    if (!tx) {
      return {
        success: false,
        error: 'Transacción no encontrada',
        isMock: true
      };
    }
    
    return {
      success: true,
      ...tx,
      isMock: true
    };
  },
  
  /**
   * Obtiene estadísticas de la blockchain
   * @returns {Promise<Object>} Estadísticas
   */
  async getStats() {
    // Simular tiempo de red
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const domains = Object.entries(mockDomains);
    const maliciousDomains = domains.filter(([_, info]) => !info.isSafe);
    const safeDomains = domains.filter(([_, info]) => info.isSafe);
    
    return {
      success: true,
      totalDomains: domains.length,
      maliciousDomains: maliciousDomains.length,
      safeDomains: safeDomains.length,
      totalReports: maliciousDomains.reduce((sum, [_, info]) => sum + (info.reports || 0), 0),
      lastUpdated: new Date(),
      isMock: true
    };
  },
  
  /**
   * Verifica si el servicio está activo
   * @returns {Promise<boolean>} true si está activo
   */
  async isActive() {
    return true;
  }
};

module.exports = BlockchainService;
