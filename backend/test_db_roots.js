require('dotenv').config();
const { pool } = require('./config/db');

async function test() {
    try {
        const res = await pool.query(`
            SELECT m.id, m.full_name, m.spouse_id, m.father_id, m.mother_id, m.created_at
            FROM members m
            JOIN homes h ON m.home_id = h.id
            JOIN villages v ON m.village_id = v.id
            WHERE h.name = 'নিরঞ্জন মন্ডলের বাড়ি' AND v.name = 'ভেন্নাবাড়ী'
              AND m.deleted_at IS NULL;
        `);
        console.log("All active members:", res.rows.map(r => r.full_name).join(', '));
        
        const roots = res.rows.filter(m => !m.father_id && !m.mother_id);
        console.log("Roots:", roots.map(r => r.full_name).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
test();
