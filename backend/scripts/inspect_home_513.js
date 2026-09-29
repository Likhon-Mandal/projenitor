require('dotenv').config();
const { pool } = require('../config/db');

async function main() {
    try {
        const members = await pool.query(`
            SELECT id, full_name, name_bangla, name_english, father_id, mother_id, spouse_id, level, deleted_at
            FROM members 
            WHERE home_id = 513
            ORDER BY level, created_at
        `);
        console.log(`TOTAL MEMBERS IN HOME 513: ${members.rows.length}`);
        members.rows.forEach((m, i) => {
            console.log(`[${i+1}] ID: ${m.id} | Name: "${m.name_bangla || m.full_name}" | FatherID: ${m.father_id} | Level: ${m.level} | DeletedAt: ${m.deleted_at}`);
        });

        // Search specifically for Tilok Mandal's ID
        const tilok = members.rows.find(m => (m.name_bangla && m.name_bangla.includes('তিলক')) || (m.full_name && m.full_name.toLowerCase().includes('tilok')));
        if (tilok) {
            console.log("\n>>> FOUND TILOK MANDAL:", tilok);
            // Search if any member across the ENTIRE database has father_id = tilok.id
            const anyChildren = await pool.query(`
                SELECT id, full_name, name_bangla, home_id, father_id, deleted_at 
                FROM members 
                WHERE father_id = $1 OR mother_id = $1
            `, [tilok.id]);
            console.log("Children of Tilok anywhere in DB:", anyChildren.rows);

            // Also search if there is any member with father's name or notes containing Tilok
            const searchTilok = await pool.query(`
                SELECT id, full_name, name_bangla, home_id, father_id, deleted_at 
                FROM members 
                WHERE bio ILIKE '%তিলক%' OR bio ILIKE '%tilok%'
            `);
            console.log("Members with Tilok in bio:", searchTilok.rows);
        } else {
            console.log("\n>>> Tilok Mandal NOT found in home 513!");
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
main();
