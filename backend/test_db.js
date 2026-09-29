const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  const res = await pool.query('SELECT member_id, spouse_id FROM member_spouses LIMIT 5');
  console.log(res.rows);
  if (res.rows.length > 0) {
    const memberId = res.rows[0].member_id;
    const axios = require('axios');
    const apiRes = await axios.get(`http://localhost:5001/api/members/${memberId}`);
    console.log(JSON.stringify(apiRes.data.spouses, null, 2));
  }
  process.exit(0);
}
run();
