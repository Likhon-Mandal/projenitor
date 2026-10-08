const { pool } = require('./config/db');

async function run() {
    try {
        console.log('Adding columns to help_requests...');
        await pool.query(`
            ALTER TABLE help_requests ADD COLUMN IF NOT EXISTS contact_number VARCHAR(100);
            ALTER TABLE help_requests ADD COLUMN IF NOT EXISTS help_seeker_id UUID;
            ALTER TABLE help_requests ADD COLUMN IF NOT EXISTS posted_by_member_id UUID;
            ALTER TABLE help_requests ADD COLUMN IF NOT EXISTS posted_by_user_id VARCHAR(100);
        `);
        console.log('Columns added successfully.');

        console.log('Backfilling help_seeker_id for existing records...');
        const seekerRes = await pool.query(`
            UPDATE help_requests hr
            SET help_seeker_id = m.id
            FROM members m
            WHERE hr.help_seeker_id IS NULL 
              AND hr.help_seeker IS NOT NULL
              AND (
                LOWER(TRIM(hr.help_seeker)) = LOWER(TRIM(m.full_name))
                OR LOWER(TRIM(hr.help_seeker)) = LOWER(TRIM(m.name_bangla))
                OR LOWER(TRIM(hr.help_seeker)) = LOWER(TRIM(m.name_english))
              )
            RETURNING hr.id, hr.help_seeker, hr.help_seeker_id;
        `);
        console.log('Updated seekers:', seekerRes.rows);

        console.log('Backfilling posted_by_member_id for existing records...');
        const posterRes = await pool.query(`
            UPDATE help_requests hr
            SET posted_by_member_id = m.id
            FROM members m
            WHERE hr.posted_by_member_id IS NULL 
              AND hr.posted_by IS NOT NULL
              AND (
                LOWER(TRIM(hr.posted_by)) = LOWER(TRIM(m.full_name))
                OR LOWER(TRIM(hr.posted_by)) = LOWER(TRIM(m.name_bangla))
                OR LOWER(TRIM(hr.posted_by)) = LOWER(TRIM(m.name_english))
              )
            RETURNING hr.id, hr.posted_by, hr.posted_by_member_id;
        `);
        console.log('Updated posters:', posterRes.rows);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();
