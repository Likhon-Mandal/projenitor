const { pool } = require('./config/db');

async function test() {
  const result = await pool.query('SELECT member_id, spouse_id FROM member_spouses LIMIT 10');
  console.log("MEMBER_SPOUSES:", result.rows);
  const mRes = await pool.query('SELECT id, full_name, spouse_id FROM members WHERE spouse_id IS NOT NULL LIMIT 10');
  console.log("MEMBERS WITH SPOUSE_ID:", mRes.rows);
  process.exit();
}
test();
