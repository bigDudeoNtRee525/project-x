import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import dotenv from 'dotenv';
import routes from './routes';

import path from 'path';

// Load environment variables
// Try to load from root .env if running in monorepo
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
// Also load local .env (overrides root if present, though dotenv default is no-override, but good to have)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Parse allowed origins from environment variable
const getAllowedOrigins = (): string[] | boolean => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;

  // If no origins set, allow all (for easier debugging)
  if (!allowedOrigins) {
    console.warn('WARNING: ALLOWED_ORIGINS not set. Allowing all origins.');
    return true;
  }

  const origins = allowedOrigins.split(',').map(origin => origin.trim());
  console.log('CORS allowed origins:', origins);
  return origins;
};

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/api/v1/health' || req.method === 'OPTIONS', // Skip health checks and CORS preflight
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // Stricter for auth
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
  skip: (req) => req.method === 'OPTIONS', // Skip CORS preflight
});

// CORS configuration - must be before other middleware
const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Middleware - CORS must come first
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression()); // Compress all responses
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use(limiter);
app.use('/api/v1/auth', authLimiter);

// Health check endpoint
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', routes);

// Error handling middleware (should be after routes)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  const origins = getAllowedOrigins();
  console.log(`Allowed Origins: ${Array.isArray(origins) ? origins.join(', ') || 'None' : 'All (Dev Mode)'}`);
});