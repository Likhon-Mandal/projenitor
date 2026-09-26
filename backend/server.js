require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { pool } = require('./config/db');
const { seedSuperAdmin } = require('./seedSuperAdmin');
const encryptionMiddleware = require('./middleware/encryptionMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Global API Obfuscation Middleware
app.use(encryptionMiddleware);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/family', require('./routes/familyRoutes'));
app.use('/api/committee', require('./routes/committee'));
app.use('/api/eminent', require('./routes/eminent'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/events', require('./routes/events'));
app.use('/api/help', require('./routes/help'));
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

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Seed SuperAdmin on every startup
  await seedSuperAdmin();
});
