require('dotenv').config();
const { pool } = require('./config/db');

async function test() {
    try {
        const res = await pool.query(`
            SELECT m.id, m.full_name, m.spouse_id, m.father_id, m.mother_id
            FROM members m
            WHERE m.full_name ILIKE '%শোভা%' OR m.full_name ILIKE '%shova%' OR m.full_name ILIKE '%রামগতি%';
        `);
        console.log("Members:", res.rows);
        
        const res2 = await pool.query(`
            SELECT * FROM member_spouses;
        `);
        console.log("Member Spouses:", res2.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
test();
