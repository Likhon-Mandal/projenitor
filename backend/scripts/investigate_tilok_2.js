require('dotenv').config();
const { pool } = require('../config/db');

async function main() {
    try {
        console.log("\n=== ALL MEMBERS WITH home_id = 513 (INCLUDING DELETED) ===");
        const members = await pool.query(`
            SELECT id, full_name, name_bangla, name_english, father_id, mother_id, spouse_id, level, deleted_at, created_at
            FROM members 
            WHERE home_id = 513
            ORDER BY level, created_at
        `);
        console.log(`Found ${members.rows.length} members in home_id 513:`);
        members.rows.forEach(m => console.log(m));

        console.log("\n=== ALL RECENTLY DELETED MEMBERS IN DATABASE (deleted_at IS NOT NULL) ===");
        const deleted = await pool.query(`
            SELECT id, full_name, name_bangla, home_id, father_id, deleted_at 
            FROM members 
            WHERE deleted_at IS NOT NULL 
            ORDER BY deleted_at DESC LIMIT 30
        `);
        console.log(`Found ${deleted.rows.length} deleted members across whole database:`);
        deleted.rows.forEach(d => console.log(d));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
main();
