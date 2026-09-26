require('dotenv').config();
const { pool } = require('./config/db');

async function test() {
    try {
        const res = await pool.query(`
            SELECT m.id, m.full_name, m.spouse_id, m.father_id, m.mother_id, h.name as home_name, v.name as village
            FROM members m
            JOIN homes h ON m.home_id = h.id
            JOIN villages v ON m.village_id = v.id
            WHERE h.name = 'নিরঞ্জন মন্ডলের বাড়ি' AND v.name = 'ভেন্নাবাড়ী'
              AND (m.full_name ILIKE '%shova%' OR m.full_name ILIKE '%রামগতি%');
        `);
        console.log("Found in household:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
test();
