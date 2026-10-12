require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { pool } = require('./config/db');
const { seedSuperAdmin } = require('./seedSuperAdmin');
const encryptionMiddleware = require('./middleware/encryptionMiddleware');
const { apiLogger } = require('./middleware/apiLogger');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
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


