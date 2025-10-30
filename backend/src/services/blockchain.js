// Blockchain service facade for demo/dev
// Provides the interface expected by routes using local mock data

const { getDomainInfo } = require('./mockData');

// Minimal in-memory cache stats to satisfy stats.js
const cacheStats = {
  hits: 0,
  misses: 0,
  keys: 0
};

// In-memory reports store for demo/report endpoints
const reportsStore = [];

// Known official entities for demo (ids align with routes/entities.js)
const officialEntities = {
  'bancogalicia.com.ar': { id: '1', name: 'Banco Galicia', category: 'banking' },
  'bbva.com.ar': { id: '2', name: 'BBVA Argentina', category: 'banking' },
  'mercadopago.com.ar': { id: '3', name: 'Mercado Pago', category: 'fintech' },
  'mercadopago.com': { id: '3', name: 'Mercado Pago', category: 'fintech' },
  'uala.com.ar': { id: '4', name: 'Ualá', category: 'fintech' }
};

function normalizeDomain(domain) {
  return String(domain || '').toLowerCase().replace(/^www\./, '');
}

async function initialize() {
  // No real blockchain in demo; pretend to init
  return Promise.resolve();
}

async function isDomainOfficial(domain) {
  const normalized = normalizeDomain(domain);

  // Try mock database first
  const info = getDomainInfo(normalized);
  if (info && info.verified) {
    return {
      isOfficial: true,
      entityId: info.entity || info.entityId || 'mock',
      confidence: 95,
      source: 'mock',
      category: info.category
    };
  }

  // Fallback to explicit demo list and subdomain match
  const exact = officialEntities[normalized];
  if (exact) {
    return {
      isOfficial: true,
      entityId: exact.id,
      confidence: 95,
      source: 'mock',
      category: exact.category
    };
  }

  // Check if domain is a subdomain of a known official domain
  const match = Object.keys(officialEntities).find(base => normalized.endsWith('.' + base));
  if (match) {
    const data = officialEntities[match];
    return {
      isOfficial: true,
      entityId: data.id,
      confidence: 90,
      source: 'mock',
      category: data.category
    };
  }

  return {
    isOfficial: false,
    entityId: null,
    confidence: 0,
    source: 'mock'
  };
}

async function getEntityInfo(entityId) {
  // Minimal demo data aligned with routes/entities.js
  const map = {
    '1': { id: '1', name: 'Banco Galicia', website: 'https://bancogalicia.com.ar', country: 'AR', verified: true },
    '2': { id: '2', name: 'BBVA Argentina', website: 'https://bbva.com.ar', country: 'AR', verified: true },
    '3': { id: '3', name: 'Mercado Pago', website: 'https://mercadopago.com.ar', country: 'AR', verified: true },
    '4': { id: '4', name: 'Ualá', website: 'https://uala.com.ar', country: 'AR', verified: true }
  };
  if (map[entityId]) return map[entityId];
  // Fallback generic object
  return { id: String(entityId), name: `Entity ${entityId}`, verified: false };
}

async function checkPhishingReports(url) {
  // Demo implementation: no real reports; structure matches verify.js expectations
  return {
    isReported: false,
    reportCount: 0,
    isBlacklisted: false
  };
}

// Submit a phishing report (demo). Pretend we wrote to chain and return a tx hash.
async function submitPhishingReport(url, metadataCID) {
  const txHash = '0x' + Math.random().toString(16).substring(2).padEnd(64, '0');
  const report = {
    id: String(Date.now()),
    url,
    metadataCID,
    transactionHash: txHash,
    blockNumber: 1,
    timestamp: new Date().toISOString(),
    isVerified: false
  };
  reportsStore.unshift(report);
  if (reportsStore.length > 200) reportsStore.pop();
  return {
    reportId: report.id,
    transactionHash: txHash,
    blockNumber: report.blockNumber
  };
}

// Return recent reports (demo)
async function getRecentReports(limit = 10) {
  return reportsStore.slice(0, Math.max(0, parseInt(limit)) || 10);
}

function getCacheStats() {
  return { ...cacheStats };
}

module.exports = {
  initialize,
  isDomainOfficial,
  getEntityInfo,
  checkPhishingReports,
  submitPhishingReport,
  getRecentReports,
  getCacheStats
};
