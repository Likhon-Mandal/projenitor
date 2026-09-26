require('dotenv').config();
const { pool } = require('./config/db');

async function test() {
    try {
        const res = await pool.query(`
            SELECT m.id, m.full_name, m.deleted_at
            FROM members m
            WHERE m.id IN (
                '1b37aa61-955d-485e-9874-bb61a74a421f',
                'a0b954c0-5699-43bb-a011-b6d384145bb4',
                '5bbc17b6-edf7-42bc-8210-6cc8f2c43e4c',
                'b1867941-ca64-4240-b397-6dc6f227f311',
                '93f3aa85-539f-466b-89b7-8ae1a2282b16',
                '3792ce26-1eca-4af2-b277-d6cae485fedd',
                '8485a77f-009e-43d7-8163-e80aaf8297e0'
            );
        `);
        console.log("Shova duplicates:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
test();
