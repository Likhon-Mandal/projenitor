const { Pool } = require('pg');

const poolConfig = (process.env.DATABASE_URL || process.env.POSTGRES_URL)
  ? {
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: process.env.VERCEL ? 5 : 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

// Prevent idle client errors from crashing the Node.js process (e.g. on network drops or laptop sleep)
pool.on('error', (err, client) => {
  console.error('[PostgreSQL Pool] Unexpected error on idle client:', err.message);
});

module.exports = { pool };

