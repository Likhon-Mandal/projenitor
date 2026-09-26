require('dotenv').config();
const { pool } = require('./config/db');

async function test() {
    try {
        const res = await pool.query(`
            SELECT m.id, m.full_name, m.spouse_id, m.father_id, m.mother_id
            FROM members m
            WHERE m.father_id = 'bb7cf6b0-f773-4fdc-ab0a-5c463cbc2281' OR m.mother_id = 'bb7cf6b0-f773-4fdc-ab0a-5c463cbc2281'
               OR m.father_id IN (SELECT id FROM members WHERE full_name ILIKE '%shova%')
               OR m.mother_id IN (SELECT id FROM members WHERE full_name ILIKE '%shova%');
        `);
        console.log("Children of Ramgati or Shova:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
test();
