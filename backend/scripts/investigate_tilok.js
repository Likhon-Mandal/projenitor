require('dotenv').config();
const { pool } = require('../config/db');

async function main() {
    try {
        console.log("=== SEARCHING FOR TILOK MANDAL ===");
        const tilokRes = await pool.query(`
            SELECT id, full_name, name_bangla, father_id, mother_id, home_name, village, is_deleted, deleted_at 
            FROM members 
            WHERE full_name ILIKE '%tilok%' 
               OR name_bangla ILIKE '%তিলক%' 
               OR full_name ILIKE '%mandal%' 
               OR name_bangla ILIKE '%মন্ডল%'
        `);
        console.log(`Found ${tilokRes.rows.length} members with tilok/mandal:`);
        tilokRes.rows.forEach(r => {
            if (r.full_name?.includes('Tilok') || r.name_bangla?.includes('তিলক') || r.full_name?.includes('Ramgoti') || r.name_bangla?.includes('রামগতি')) {
                console.log(r);
            }
        });

        console.log("\n=== ALL MEMBERS IN NIRANJAN MANDAL BARI ===");
        const bariRes = await pool.query(`
            SELECT id, full_name, name_bangla, father_id, mother_id, home_name, village, is_deleted, deleted_at
            FROM members
            WHERE home_name ILIKE '%নিরঞ্জন%' OR home_name ILIKE '%niranjan%'
        `);
        console.log(`Found ${bariRes.rows.length} members in Niranjan Mandal bari:`);
        bariRes.rows.forEach(r => console.log(r));

        console.log("\n=== RECENTLY DELETED MEMBERS ===");
        const delRes = await pool.query(`
            SELECT id, full_name, name_bangla, father_id, home_name, is_deleted, deleted_at
            FROM members
            WHERE is_deleted = true
            ORDER BY deleted_at DESC LIMIT 20
        `);
        console.log(`Found ${delRes.rows.length} soft deleted members:`);
        delRes.rows.forEach(r => console.log(r));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
main();
