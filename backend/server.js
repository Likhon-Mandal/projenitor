require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { pool } = require('./config/db');
const { seedSuperAdmin } = require('./seedSuperAdmin');
const encryptionMiddleware = require('./middleware/encryptionMiddleware');
const { apiLogger } = require('./middleware/apiLogger');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows cross-origin image loading (Cloudinary & local uploads)
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  contentSecurityPolicy: false // API backend - disabled to prevent breaking frontend tunnels / Vite scripts
}));

// Allowed Origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5001',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : [])
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Non-browser clients (curl, Postman, server-to-server)
  if (allowedOrigins.includes(origin)) return true;
  // Allow Cloudflare quick tunnels (*.trycloudflare.com)
  if (origin.endsWith('.trycloudflare.com')) return true;
  // Allow LAN network addresses (e.g. 192.168.x.x, 10.x.x.x for mobile testing on local Wi-Fi)
  if (/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) return true;
  return false;
};

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked]: Origin "${origin}" not allowed`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-encrypted', 'x-device-id']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Global API Audit & Error Logging Middleware
app.use(apiLogger);

// Global API Obfuscation Middleware
app.use(encryptionMiddleware);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/family', require('./routes/familyRoutes'));
app.use('/api/committee', require('./routes/committee'));
app.use('/api/eminent', require('./routes/eminent'));
app.use('/api/brilliant-students', require('./routes/brilliantStudentRoutes'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/events', require('./routes/events'));
app.use('/api/history', require('./routes/history'));
app.use('/api/help', require('./routes/help'));
app.use('/api/sammelans', require('./routes/sammelanRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/system', require('./routes/systemRoutes'));
app.use('/uploads', express.static('uploads'));

// Basic Route
app.get('/', (req, res) => {
  res.send('Projenitor Backend is running');
});

// Database Connection Test
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connected successfully', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Express Error]:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// Start Server
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  // Seed SuperAdmin on every startup
  await seedSuperAdmin();
});

// Proper handling for nodemon restarts to prevent EADDRINUSE
process.once('SIGUSR2', () => {
  server.close(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

// Prevent unhandled promise rejections or uncaught exceptions from killing the process
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection] at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
});


