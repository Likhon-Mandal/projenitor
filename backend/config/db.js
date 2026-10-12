require('dotenv').config();
const { Pool } = require('pg');

let connString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (connString) {
  // Normalize Supabase URLs: rewrite session port 5432 to transaction pooler port 6543 to prevent EMAXCONNSESSION
  if (connString.includes('pooler.supabase.com:5432')) {
    connString = connString.replace('pooler.supabase.com:5432', 'pooler.supabase.com:6543');
  } else if (connString.includes('db.tfnzbjcsjxlelnpsgqkn.supabase.co')) {
    connString = connString
      .replace('db.tfnzbjcsjxlelnpsgqkn.supabase.co:5432', 'aws-0-ap-northeast-2.pooler.supabase.com:6543')
      .replace('db.tfnzbjcsjxlelnpsgqkn.supabase.co', 'aws-0-ap-northeast-2.pooler.supabase.com:6543');
    if (!connString.includes('postgres.tfnzbjcsjxlelnpsgqkn:')) {
      connString = connString.replace('postgres:', 'postgres.tfnzbjcsjxlelnpsgqkn:');
    }
  }
}

const poolConfig = connString
  ? {
    connectionString: connString,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: process.env.VERCEL ? 2 : 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  }
  : {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

const pool = new Pool(poolConfig);

// Prevent idle client errors from crashing the Node.js process (e.g. on network drops or laptop sleep)
pool.on('error', (err, client) => {
  console.error('[PostgreSQL Pool] Unexpected error on idle client:', err.message);
});

module.exports = { pool };

