const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Prevent idle client errors from crashing the Node.js process (e.g. on network drops or laptop sleep)
pool.on('error', (err, client) => {
  console.error('[PostgreSQL Pool] Unexpected error on idle client:', err.message);
});

module.exports = { pool };

