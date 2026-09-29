require('dotenv').config();
const { pool } = require('../config/db');

async function wipeHome513() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get all members in home 513
        const res = await client.query('SELECT id, full_name FROM members WHERE home_id = 513');
        console.log(`Found ${res.rows.length} members in Niranjan Mandal Bari to delete.`);
        const ids = res.rows.map(r => r.id);

        if (ids.length > 0) {
            // 2. Unlink any self references or references from outside
            await client.query('UPDATE members SET father_id = NULL WHERE father_id = ANY($1::uuid[])', [ids]);
            await client.query('UPDATE members SET mother_id = NULL WHERE mother_id = ANY($1::uuid[])', [ids]);
            await client.query('UPDATE members SET spouse_id = NULL WHERE spouse_id = ANY($1::uuid[])', [ids]);

            // 3. Delete from member_spouses
            const spouseRes = await client.query('DELETE FROM member_spouses WHERE member_id = ANY($1::uuid[]) OR spouse_id = ANY($1::uuid[])', [ids]);
            console.log(`Removed ${spouseRes.rowCount} spouse connection records.`);

            // 4. Delete eminent figures or committee records if any
            await client.query('DELETE FROM eminent_figures WHERE member_id = ANY($1::uuid[])', [ids]);
            await client.query('DELETE FROM committee_members WHERE member_id = ANY($1::uuid[])', [ids]);

            // 5. Delete all members of home 513
            const delRes = await client.query('DELETE FROM members WHERE home_id = 513');
            console.log(`Successfully deleted ${delRes.rowCount} members.`);
        }

        // Verify home 513 still exists
        const homeCheck = await client.query('SELECT * FROM homes WHERE id = 513');
        console.log('Home status:', homeCheck.rows[0]);

        await client.query('COMMIT');
        console.log('✅ "নিরঞ্জন মন্ডলের বাড়ি" is completely cleaned and ready for fresh input!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error wiping home 513:', err);
    } finally {
        client.release();
        pool.end();
    }
}

wipeHome513();
