const metrics = require('../services/metrics');
const express = require('express');
const router = express.Router();

// Base de datos en memoria para amenazas detectadas
// En producciÃ³n, esto vendrÃ­a de MongoDB/PostgreSQL
let threatsDatabase = [];
let statsDatabase = {
  today: 0,
  thisWeek: 0,
  thisMonth: 0,
  byCountry: {}
};

// FunciÃ³n para agregar una nueva amenaza
function addThreat(threat) {
  const newThreat = {
    id: Date.now(),
    ...threat,
    timestamp: new Date(),
    time: 'Ahora'
  };
  
  threatsDatabase.unshift(newThreat);
  
  // Mantener solo las Ãºltimas 100 amenazas
  if (threatsDatabase.length > 100) {
    threatsDatabase = threatsDatabase.slice(0, 100);
  }
  
  // Actualizar estadÃ­sticas
  statsDatabase.today++;
  statsDatabase.thisWeek++;
  statsDatabase.thisMonth++;
  
  if (!statsDatabase.byCountry[threat.country]) {
    statsDatabase.byCountry[threat.country] = 0;
  }
  statsDatabase.byCountry[threat.country]++;
  
  return newThreat;
}

// FunciÃ³n para obtener el paÃ­s con mÃ¡s detecciones
function getTopCountry() {
  const countries = Object.entries(statsDatabase.byCountry);
  if (countries.length === 0) return 'Argentina';
  
  return countries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  )[0];
}

// FunciÃ³n para calcular tiempo relativo
function getRelativeTime(timestamp) {
  const now = new Date();
  const diff = Math.floor((now - new Date(timestamp)) / 1000); // segundos
  
  if (diff < 60) return 'Ahora';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
  return `Hace ${Math.floor(diff / 86400)} dÃ­as`;
}

// GET /api/v1/threats/recent - Obtener amenazas recientes
router.get('/recent', (req, res) => {
  try {
    // Actualizar tiempos relativos
    const threatsWithUpdatedTime = threatsDatabase.map(threat => ({
      ...threat,
      time: getRelativeTime(threat.timestamp)
    }));
    
    res.json({
      success: true,
      threats: threatsWithUpdatedTime.slice(0, 20), // Ãšltimas 20
      stats: {
        today: statsDatabase.today,
        thisWeek: statsDatabase.thisWeek,
        thisMonth: statsDatabase.thisMonth,
        topCountry: getTopCountry()
      }
    });
  } catch (error) {
    console.error('Error fetching threats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener amenazas'
    });
  }
});

// POST /api/v1/threats/report - Reportar nueva amenaza
router.post('/report', (req, res) => {
  try {
    const { url, type, severity, country, city, lat, lng, userAgent, ip } = req.body;
    
    // ValidaciÃ³n bÃ¡sica
    if (!url || !type || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos'
      });
    }
    
    // Determinar ubicaciÃ³n si no se proporciona
    const location = {
      country: country || 'Argentina',
      city: city || 'Buenos Aires',
      lat: lat || -34.6037,
      lng: lng || -58.3816
    };
    
    const newThreat = addThreat({
      url,
      type,
      severity,
      ...location,
      userAgent: userAgent || 'Unknown',
      ip: ip || 'Unknown'
    });
    
    try { metrics.record('report'); } catch {}\n\n    res.json({\n      success: true,\n      threat: newThreat,
      message: 'Amenaza reportada exitosamente'
    });
  } catch (error) {
    console.error('Error reporting threat:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reportar amenaza'
    });
  }
});

// GET /api/v1/threats/stats - Obtener estadÃ­sticas globales
router.get('/stats', (req, res) => {
  try {
    res.json({
      success: true,
      stats: {
        total: threatsDatabase.length,
        today: statsDatabase.today,
        thisWeek: statsDatabase.thisWeek,
        thisMonth: statsDatabase.thisMonth,
        byCountry: statsDatabase.byCountry,
        topCountry: getTopCountry(),
        bySeverity: {
          critical: threatsDatabase.filter(t => t.severity === 'critical').length,
          high: threatsDatabase.filter(t => t.severity === 'high').length,
          medium: threatsDatabase.filter(t => t.severity === 'medium').length,
          low: threatsDatabase.filter(t => t.severity === 'low').length
        },
        byType: threatsDatabase.reduce((acc, threat) => {
          acc[threat.type] = (acc[threat.type] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadÃ­sticas'
    });
  }
});

// Inicializar con datos de demostraciÃ³n
function initializeDemoData() {
  const demoThreats = [
    { url: 'http://paypa1-secure.tk', type: 'Typosquatting', severity: 'high', country: 'Argentina', city: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
    { url: 'http://g00gle-verify.ml', type: 'Brand Impersonation', severity: 'critical', country: 'Brasil', city: 'SÃ£o Paulo', lat: -23.5505, lng: -46.6333 },
    { url: 'http://amaz0n-login.ga', type: 'Credential Theft', severity: 'critical', country: 'MÃ©xico', city: 'Ciudad de MÃ©xico', lat: 19.4326, lng: -99.1332 },
    { url: 'http://secure-bank.cf', type: 'Phishing Email', severity: 'medium', country: 'Chile', city: 'Santiago', lat: -33.4489, lng: -70.6693 },
    { url: 'sms://verify-account', type: 'Smishing', severity: 'high', country: 'Colombia', city: 'BogotÃ¡', lat: 4.7110, lng: -74.0721 },
    { url: 'http://microsoft-update.tk', type: 'Brand Impersonation', severity: 'high', country: 'EspaÃ±a', city: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { url: 'http://netflix-billing.ml', type: 'Phishing Email', severity: 'medium', country: 'PerÃº', city: 'Lima', lat: -12.0464, lng: -77.0428 },
    { url: 'http://whatsapp-verify.ga', type: 'Typosquatting', severity: 'high', country: 'Uruguay', city: 'Montevideo', lat: -34.9011, lng: -56.1645 }
  ];
  
  demoThreats.forEach(threat => addThreat(threat));
  
  // Ajustar estadÃ­sticas para que parezcan mÃ¡s realistas
  statsDatabase.today = 243;
  statsDatabase.thisWeek = 1547;
  statsDatabase.thisMonth = 6892;
}

// Inicializar datos de demostraciÃ³n al cargar
initializeDemoData();

module.exports = router;

