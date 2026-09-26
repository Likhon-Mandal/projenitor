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
              AND m.full_name ILIKE '%shova%'
              AND m.spouse_id IS NULL
              AND m.father_id IS NULL
              AND m.mother_id IS NULL
              AND m.deleted_at IS NULL
              AND NOT EXISTS (SELECT 1 FROM member_spouses ms WHERE ms.member_id = m.id OR ms.spouse_id = m.id);
        `);
        console.log("Unlinked Shova duplicates to delete:", res.rows);
        
        // Uncomment to actually delete them if confirmed:
        if (res.rows.length > 0) {
            const ids = res.rows.map(r => r.id);
            const del = await pool.query(`UPDATE members SET deleted_at = NOW() WHERE id = ANY($1)`, [ids]);
            console.log("Deleted rows:", del.rowCount);
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
test();
