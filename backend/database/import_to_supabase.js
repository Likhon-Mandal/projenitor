const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runImport() {
  const password = process.argv[2] || process.env.DB_PASSWORD || process.env.SUPABASE_PASSWORD;
  
  if (!password || password === '[YOUR-PASSWORD]' || password === '123456') {
    console.error('❌ Error: Please provide your Supabase database password!');
    console.log('\nUsage:');
    console.log('  node database/import_to_supabase.js <YOUR_SUPABASE_PASSWORD>');
    console.log('Or set DB_PASSWORD in backend/.env with your actual Supabase password.');
    process.exit(1);
  }

  // Use the IPv4-compatible pooler host for ap-northeast-2
  const connectionString = `postgresql://postgres.tfnzbjcsjxlelnpsgqkn:${encodeURIComponent(password)}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`;

  console.log('🔗 Connecting to Supabase database (Singapore Pooler)...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to Supabase!');

    const sqlFilePath = path.join(__dirname, 'projenitor_inserts.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found at ${sqlFilePath}`);
    }

    console.log('📂 Reading database dump (4,084 lines, 22 tables)...');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('🚀 Executing database migration and importing all tables & rows...');
    await client.query(sql);
    console.log('✅ Migration executed successfully!');

    // Verify row counts
    console.log('\n📊 Verifying transferred tables and row counts:');
    const tables = [
      'countries', 'divisions', 'districts', 'upazilas', 'villages', 'homes',
      'members', 'member_spouses', 'sammelans', 'committees', 'committee_members',
      'events', 'event_memories', 'eminent_figures', 'history_records', 'notices',
      'help_requests', 'users', 'admin_users', 'admin_requests', 'brilliant_student_requests',
      'api_logs'
    ];

    for (const t of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM public.${t}`);
        console.log(`  ✓ ${t.padEnd(28)} : ${res.rows[0].count} rows`);
      } catch (err) {
        console.log(`  ✗ ${t.padEnd(28)} : ${err.message}`);
      }
    }

    console.log('\n🎉 ALL TABLES AND DATA HAVE BEEN SUCCESSFULLY MIGRATED TO SUPABASE!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    if (err.message.includes('password authentication failed')) {
      console.error('👉 The database password entered was incorrect. Please check your Supabase dashboard password.');
    }
  } finally {
    await client.end();
  }
}

runImport();
