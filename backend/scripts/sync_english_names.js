require('dotenv').config({ path: __dirname + '/../.env' });
const { pool } = require('../config/db');
const { transliterateBengali } = require('../utils/transliterate');

async function syncEnglishNames() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT id, full_name, name_bangla, name_english 
      FROM members 
      WHERE (name_english IS NULL OR TRIM(name_english) = '') 
        AND deleted_at IS NULL
    `);

    console.log(`Found ${res.rows.length} members without English name.`);
    let updatedCount = 0;

    await client.query('BEGIN');

    for (const m of res.rows) {
      const sourceName = m.name_bangla || m.full_name;
      if (!sourceName) continue;

      const generatedEnglish = transliterateBengali(sourceName);
      if (generatedEnglish && generatedEnglish.trim() !== '') {
        await client.query(`
          UPDATE members 
          SET name_english = $1 
          WHERE id = $2
        `, [generatedEnglish.trim(), m.id]);
        updatedCount++;
      }
    }

    await client.query('COMMIT');
    console.log(`Successfully synced name_english for ${updatedCount} members!`);

    // Verify sample from Niranjan Mandal Bari
    const sampleRes = await client.query(`
      SELECT full_name, name_bangla, name_english 
      FROM members 
      WHERE full_name IN ('তিলক মন্ডল', 'মহেশ মন্ডল', 'নেপাল মন্ডল', 'গোপাল মন্ডল', 'সুবল মন্ডল', 'নিত্যানন্দ মন্ডল', 'সদানন্দ মন্ডল')
    `);
    console.log('\nVerified sample members in Niranjan Mandal Bari:');
    console.table(sampleRes.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error syncing english names:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

syncEnglishNames();
