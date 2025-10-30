// Mock data for testing without blockchain - TrustTentacle 🐙
// This simulates verified domains until smart contracts are deployed

const verifiedDomains = {
  // Banking - Argentina
  'bancogalicia.com': { entity: 'Banco Galicia', verified: true, category: 'banking' },
  'santander.com.ar': { entity: 'Banco Santander', verified: true, category: 'banking' },
  'bancociudad.com.ar': { entity: 'Banco Ciudad', verified: true, category: 'banking' },
  'bna.com.ar': { entity: 'Banco Nación', verified: true, category: 'banking' },
  'macro.com.ar': { entity: 'Banco Macro', verified: true, category: 'banking' },
  'hsbc.com.ar': { entity: 'HSBC Argentina', verified: true, category: 'banking' },
  'icbc.com.ar': { entity: 'ICBC Argentina', verified: true, category: 'banking' },
  'bbva.com.ar': { entity: 'BBVA Argentina', verified: true, category: 'banking' },
  
  // Banking - International
  'bankofamerica.com': { entity: 'Bank of America', verified: true, category: 'banking' },
  'chase.com': { entity: 'Chase Bank', verified: true, category: 'banking' },
  'wellsfargo.com': { entity: 'Wells Fargo', verified: true, category: 'banking' },
  'citibank.com': { entity: 'Citibank', verified: true, category: 'banking' },
  
  // Payment Services
  'paypal.com': { entity: 'PayPal', verified: true, category: 'payment' },
  'stripe.com': { entity: 'Stripe', verified: true, category: 'payment' },
  'mercadopago.com': { entity: 'Mercado Pago', verified: true, category: 'payment' },
  'mercadopago.com.ar': { entity: 'Mercado Pago Argentina', verified: true, category: 'payment' },
  
  // E-commerce
  'amazon.com': { entity: 'Amazon', verified: true, category: 'ecommerce' },
  'ebay.com': { entity: 'eBay', verified: true, category: 'ecommerce' },
  'mercadolibre.com': { entity: 'Mercado Libre', verified: true, category: 'ecommerce' },
  'mercadolibre.com.ar': { entity: 'Mercado Libre Argentina', verified: true, category: 'ecommerce' },
  
  // Social Media
  'facebook.com': { entity: 'Facebook', verified: true, category: 'social' },
  'instagram.com': { entity: 'Instagram', verified: true, category: 'social' },
  'twitter.com': { entity: 'Twitter', verified: true, category: 'social' },
  'x.com': { entity: 'X (Twitter)', verified: true, category: 'social' },
  'linkedin.com': { entity: 'LinkedIn', verified: true, category: 'social' },
  
  // Tech Companies
  'google.com': { entity: 'Google', verified: true, category: 'tech' },
  'microsoft.com': { entity: 'Microsoft', verified: true, category: 'tech' },
  'apple.com': { entity: 'Apple', verified: true, category: 'tech' },
  'github.com': { entity: 'GitHub', verified: true, category: 'tech' },
  'stackoverflow.com': { entity: 'Stack Overflow', verified: true, category: 'tech' },
  
  // Cryptocurrency
  'binance.com': { entity: 'Binance', verified: true, category: 'crypto' },
  'coinbase.com': { entity: 'Coinbase', verified: true, category: 'crypto' },
  'kraken.com': { entity: 'Kraken', verified: true, category: 'crypto' },
};

// Known phishing patterns
const suspiciousPatterns = [
  /paypa1/i,           // paypal con número 1
  /g00gle/i,           // google con ceros
  /amaz0n/i,           // amazon con cero
  /micros0ft/i,        // microsoft con cero
  /faceb00k/i,         // facebook con ceros
  /netf1ix/i,          // netflix con 1
  /.*-secure\./i,      // dominios con "secure"
  /.*-verify\./i,      // dominios con "verify"
  /.*-login\./i,       // dominios con "login"
  /.*-account\./i,     // dominios con "account"
  /.*-banking\./i,     // dominios con "banking"
  /.*-update\./i,      // dominios con "update"
];

// Suspicious TLDs
const suspiciousTLDs = [
  '.tk', '.ml', '.ga', '.cf', '.gq',  // Free domains
  '.xyz', '.top', '.click', '.link',   // Often abused
];

// String-based indicators to avoid regex ReDoS
const suspiciousIndicators = [
  'paypa1', 'g00gle', 'amaz0n', 'micros0ft', 'faceb00k', 'netf1ix',
  '-secure.', '-verify.', '-login.', '-account.', '-banking.', '-update.'
];

function getDomainInfo(domain) {
  // Normalize domain
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
  
  // Check if it's a verified domain
  if (verifiedDomains[normalizedDomain]) {
    return {
      found: true,
      verified: true,
      ...verifiedDomains[normalizedDomain],
      confidence: 100,
      source: 'mock_database'
    };
  }
  
  // Check for suspicious indicators (no regex)
  for (const token of suspiciousIndicators) {
    if (normalizedDomain.includes(token)) {
      return {
        found: true,
        verified: false,
        suspicious: true,
        reason: 'Domain matches known phishing indicator',
        confidence: 0,
        source: 'pattern_detection'
      };
    }
  }
  
  // Check for suspicious TLDs
  for (const tld of suspiciousTLDs) {
    if (normalizedDomain.endsWith(tld)) {
      return {
        found: true,
        verified: false,
        suspicious: true,
        reason: 'Domain uses suspicious TLD often used for phishing',
        confidence: 0,
        source: 'tld_detection'
      };
    }
  }
  
  // Unknown domain
  return {
    found: false,
    verified: false,
    suspicious: false,
    reason: 'Domain not in verified database',
    confidence: 0,
    source: 'unknown'
  };
}

function getAllVerifiedDomains() {
  return Object.entries(verifiedDomains).map(([domain, info]) => ({
    domain,
    ...info
  }));
}

function searchEntities(query) {
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  for (const [domain, info] of Object.entries(verifiedDomains)) {
    if (info.entity.toLowerCase().includes(lowerQuery) || 
        domain.includes(lowerQuery)) {
      results.push({
        domain,
        ...info
      });
    }
  }
  
  return results;
}

module.exports = {
  getDomainInfo,
  getAllVerifiedDomains,
  searchEntities,
  verifiedDomains,
  suspiciousIndicators,
  suspiciousPatterns,
  suspiciousTLDs
};
