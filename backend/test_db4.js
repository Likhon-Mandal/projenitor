require('dotenv').config();
const { pool } = require('./config/db');

async function test() {
    try {
        const res = await pool.query(`
            SELECT m.id, m.full_name, m.spouse_id, m.father_id, m.mother_id
            FROM members m
            WHERE m.id IN (
                'e4994241-2db2-41c3-bd2c-ab74ced6cdf0',
                'a9ce3458-a002-45f6-90c7-81a35c709c6a',
                '7da465c9-9d42-442a-909d-dca37e40b7d6'
            );
        `);
        console.log("Other members:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
test();
