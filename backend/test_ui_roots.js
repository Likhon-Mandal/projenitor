require('dotenv').config();
const { pool } = require('./config/db');

async function test() {
    try {
        const res = await pool.query(`
            SELECT m.id, m.full_name, m.spouse_id, m.father_id, m.mother_id,
            (
                SELECT json_agg(json_build_object('id', s_inner.id))
                FROM (
                    SELECT DISTINCT s.id
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
              AND m.deleted_at IS NULL;
        `);
        
        let members = res.rows;
        let spouseIds = new Set();
        members.forEach(member => {
            if (member.spouse_id) spouseIds.add(member.spouse_id);
            if (member.mother_id) spouseIds.add(member.mother_id);
            if (member.spouses) {
                member.spouses.forEach(s => {
                    if (s && s.id) spouseIds.add(s.id);
                });
            }
        });
        
        let roots = members.filter(m => !m.father_id && !m.mother_id && !spouseIds.has(m.id));
        console.log("Actual UI Roots:", roots.map(r => r.full_name).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
test();
