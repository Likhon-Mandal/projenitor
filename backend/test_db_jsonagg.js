require('dotenv').config();
const { pool } = require('./config/db');

async function test() {
    try {
        const res = await pool.query(`
            SELECT m.id, m.full_name,
            (
                SELECT json_agg(json_build_object('id', s_inner.id, 'full_name', s_inner.full_name))
                FROM (
                    SELECT DISTINCT s.id, s.full_name
                    FROM members s
                    WHERE (
                        s.id IN (SELECT spouse_id FROM member_spouses WHERE member_id = m.id)
                        OR s.id IN (SELECT member_id FROM member_spouses WHERE spouse_id = m.id)
                        OR s.spouse_id = m.id 
                        OR m.spouse_id = s.id
                    )
                    AND s.id != m.id
                    AND s.deleted_at IS NULL
                ) s_inner
            ) as spouses
            FROM members m
            JOIN homes h ON m.home_id = h.id
            JOIN villages v ON m.village_id = v.id
            WHERE h.name = 'নিরঞ্জন মন্ডলের বাড়ি' AND v.name = 'ভেন্নাবাড়ী'
              AND m.deleted_at IS NULL
              AND m.id = 'a9ce3458-a002-45f6-90c7-81a35c709c6a';
        `);
        console.log("Dipankar's spouses:", JSON.stringify(res.rows[0].spouses, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
test();
