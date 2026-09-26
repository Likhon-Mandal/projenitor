require('dotenv').config();
const { pool } = require('./config/db');
async function test() {
    const res = await pool.query(`SELECT * FROM member_spouses WHERE member_id = '3b90f488-8422-4416-ad8d-b08e5cc69bb4' OR spouse_id = '3b90f488-8422-4416-ad8d-b08e5cc69bb4'`);
    console.log("Spouse connections:", res.rows);
    process.exit();
}
test();
