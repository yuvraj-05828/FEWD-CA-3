const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        connectSrc: ["'self'", 'http://localhost:*', 'https://*.themealdb.com'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Cross-Origin Resource Sharing
const corsOptions = {
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting (150 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', apiLimiter);

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'COOK Recipe Management API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

// Serve frontend static assets in both dev and production
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));

// Route for root to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 Route Not Found
app.use(notFound);

// Centralized Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to database and start server if executed directly
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`[COOK Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  }).catch((err) => {
    console.error('[COOK Server] Failed to connect to DB on startup:', err.message);
  });
}

module.exports = app;
