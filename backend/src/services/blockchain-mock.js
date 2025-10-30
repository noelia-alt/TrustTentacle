/**
 * Mock blockchain service for demo/testing
 */

// Demo in-memory domain data
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

// Pending tx store
const pendingTransactions = [];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const BlockchainService = {
  async verifyDomain(domain) {
    await delay(300);
    const normalized = String(domain).toLowerCase().trim();
    // Prevent prototype pollution keys and invalid hosts
    if (!/^[a-z0-9.-]+$/.test(normalized) || normalized.includes('__proto__') || normalized.includes('prototype')) {
      return { success: false, error: 'Invalid domain', isMock: true };
    }
    const info = mockDomains[normalized];
    if (info) {
      return {
        success: true,
        isSafe: info.isSafe,
        reports: info.reports,
        verified: info.verified,
        verifiedAt: info.verifiedAt,
        verifiedBy: info.verifiedBy,
        message: info.isSafe ? 'Dominio verificado como seguro' : 'Cuidado: dominio reportado',
        source: 'mock',
        isMock: true
      };
    }
    return {
      success: true,
      isSafe: true,
      reports: 0,
      verified: false,
      message: 'Dominio no encontrado en la blockchain (mock)',
      source: 'mock',
      isMock: true
    };
  },

  async reportDomain(domain, reporter = '0x0000000000000000000000000000000000000000') {
    await delay(500);
    const normalized = String(domain).toLowerCase().trim();
    if (!/^[a-z0-9.-]+$/.test(normalized) || normalized.includes('__proto__') || normalized.includes('prototype')) {
      return { success: false, error: 'Invalid domain', isMock: true };
    }
    const txHash = `0x${Math.random().toString(16).substring(2).padEnd(64, '0')}`;

    if (!mockDomains[normalized]) {
      mockDomains[normalized] = {
        isSafe: false,
        reports: 1,
        verified: false,
        firstReportedAt: new Date(),
        lastReportedAt: new Date(),
        reportedBy: [reporter]
      };
    } else {
      mockDomains[normalized].reports = (mockDomains[normalized].reports || 0) + 1;
      mockDomains[normalized].lastReportedAt = new Date();
      mockDomains[normalized].reportedBy = Array.from(new Set([...(mockDomains[normalized].reportedBy || []), reporter]));
    }

    const tx = { hash: txHash, status: 'pending', domain: normalized, from: reporter, timestamp: new Date(), confirmations: 0 };
    pendingTransactions.push(tx);

    setTimeout(() => {
      const idx = pendingTransactions.findIndex((t) => t.hash === txHash);
      if (idx > -1) {
        pendingTransactions[idx].status = 'confirmed';
        pendingTransactions[idx].confirmations = 12;
      }
    }, 5000);

    return {
      success: true,
      transactionHash: txHash,
      message: 'Reporte enviado (mock). Esperando confirmaciones...'
    };
  },

  async getTransactionStatus(txHash) {
    await delay(200);
    const tx = pendingTransactions.find((t) => t.hash === txHash);
    if (!tx) return { success: false, error: 'Transaccion no encontrada', isMock: true };
    return { success: true, ...tx, isMock: true };
  },

  async getStats() {
    await delay(150);
    const domains = Object.entries(mockDomains);
    const malicious = domains.filter(([, info]) => !info.isSafe);
    const safe = domains.filter(([, info]) => info.isSafe);
    return {
      success: true,
      totalDomains: domains.length,
      maliciousDomains: malicious.length,
      safeDomains: safe.length,
      totalReports: malicious.reduce((sum, [, info]) => sum + (info.reports || 0), 0),
      lastUpdated: new Date(),
      isMock: true
    };
  },

  async isActive() { return true; }
};

module.exports = BlockchainService;
