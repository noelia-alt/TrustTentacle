const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

app.use('/api/', limiter);

// Routes
app.use('/api/v1/verify', require('./routes/verify'));
app.use('/api/v1/report', require('./routes/report'));
app.use('/api/v1/entities', require('./routes/entities'));
app.use('/api/v1/domains', require('./routes/domains'));
app.use('/api/v1/stats', require('./routes/stats'));
app.use('/api/v1/threats', require('./routes/threats'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1',
    tentacles: '🐙'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'The tentacles couldn\'t find what you\'re looking for 🐙',
    availableEndpoints: [
      'GET /health',
      'POST /api/v1/verify',
      'POST /api/v1/report',
      'GET /api/v1/entities',
      'GET /api/v1/domains',
      'GET /api/v1/stats'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('🚨 Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🐙 TrustTentacle API server running on port ${PORT}`);
  console.log(`🌊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Initialize blockchain connection
  require('./services/blockchain').initialize()
    .then(() => console.log('⛓️  Blockchain connection initialized'))
    .catch(err => console.error('❌ Blockchain initialization failed:', err));
});

module.exports = app;
