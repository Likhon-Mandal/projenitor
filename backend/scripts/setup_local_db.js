// Creates the local database (if missing) and applies schema.sql + all migrations in order.
// Usage: node scripts/setup_local_db.js   (reads DB_* from backend/.env)
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const base = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
};
const dbName = process.env.DB_NAME;

(async () => {
  const admin = new Client({ ...base, database: 'postgres' });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!rowCount) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Created database ${dbName}`);
  }
  await admin.end();

  const db = new Client({ ...base, database: dbName });
  await db.connect();
  const root = path.join(__dirname, '..');
  const files = [
    path.join(root, 'database', 'schema.sql'),
    ...fs.readdirSync(path.join(root, 'migrations')).filter((f) => f.endsWith('.sql')).sort()
      .map((f) => path.join(root, 'migrations', f)),
  ];
  for (const file of files) {
    try {
      await db.query(fs.readFileSync(file, 'utf8'));
      console.log('OK   ', path.basename(file));
    } catch (e) {
      console.log('FAIL ', path.basename(file), '-', e.message);
    }
  }
  await db.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
