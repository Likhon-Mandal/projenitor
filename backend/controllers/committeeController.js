const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

exports.getCommittees = async (req, res) => {
    try {
        // Fetch committees
        const committeeResult = await pool.query(
            'SELECT * FROM committees ORDER BY is_current DESC, end_date DESC NULLS LAST'
        );
        const committees = committeeResult.rows;

        // Fetch members for these committees
        const membersResult = await pool.query(`
            SELECT cm.committee_id, cm.role, cm.order_index, cm.member_id,
                   m.full_name, m.name_bangla, m.name_english, m.profile_image_url, m.occupation,
                   m.contact_number,
                   v.name as village, u.name as upazila, d.name as district, h.name as home_name
            FROM committee_members cm
            JOIN members m ON cm.member_id = m.id
            LEFT JOIN villages v ON m.village_id = v.id
            LEFT JOIN upazilas u ON m.upazila_id = u.id
            LEFT JOIN districts d ON m.district_id = d.id
            LEFT JOIN homes h ON m.home_id = h.id
            ORDER BY cm.order_index ASC
        `);
        const membersRows = membersResult.rows;

        // Group members by committee_id
        const memMap = {};
        membersRows.forEach(row => {
            if (!memMap[row.committee_id]) memMap[row.committee_id] = [];
            memMap[row.committee_id].push({
                member_id: row.member_id,
                full_name: row.full_name,
                name_bangla: row.name_bangla,
                name_english: row.name_english,
                role: row.role,
                profile_image_url: row.profile_image_url,
                occupation: row.occupation,
                contact_number: row.contact_number,
                village: row.village,
                upazila: row.upazila,
                district: row.district,
                home_name: row.home_name
            });
        });

        // Attach
        const result = committees.map(c => ({
            ...c,
            members: memMap[c.id] || []
        }));

        res.json(result);
    } catch (err) {
        console.error('Error fetching committees:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getLeaders = async (req, res) => {
    try {
        const query = `
            SELECT 
                cm.role,
                cm.order_index,
                m.id as member_id,
                m.full_name,
                m.name_bangla,
                m.name_english,
                m.contact_number,
                m.profile_image_url,
                v.name as village,
                u.name as upazila,
                d.name as district,
                h.name as home_name
            FROM committees c
            JOIN committee_members cm ON c.id = cm.committee_id
            JOIN members m ON cm.member_id = m.id
            LEFT JOIN villages v ON m.village_id = v.id
            LEFT JOIN upazilas u ON m.upazila_id = u.id
            LEFT JOIN districts d ON m.district_id = d.id
            LEFT JOIN homes h ON m.home_id = h.id
            WHERE c.is_current = TRUE
            ORDER BY cm.order_index ASC
        `;
        const result = await pool.query(query);
        const rows = result.rows;

        const president = rows.find(r => 
            /সভাপতি|president/i.test(r.role) && !/সহ|সহকারী|যুগ্ম|vice/i.test(r.role)
        );
        const secretary = rows.find(r => 
            /সাধারণ\s*সম্পাদক|general\s*secretary/i.test(r.role) && !/যুগ্ম|সহকারী|joint|assistant/i.test(r.role)
        );

        res.json({
            president: president || null,
            secretary: secretary || null
        });
    } catch (err) {
        console.error('Error fetching leaders:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createCommittee = async (req, res) => {
    const { name, start_date, end_date, is_current, members } = req.body;
    // members should be an array of: { member_id, role, order_index }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (is_current) {
            // Unset current for others
            await client.query('UPDATE committees SET is_current = FALSE');
        }

        // Insert committee
        const insertCommText = `
            INSERT INTO committees (name, start_date, end_date, is_current)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        const commRes = await client.query(insertCommText, [
            name, start_date || null, end_date || null, is_current || false
        ]);
        const newCommitteeId = commRes.rows[0].id;

        // Insert members
        if (members && members.length > 0) {
            const insertMemText = `
                INSERT INTO committee_members (committee_id, member_id, role, order_index)
                VALUES ($1, $2, $3, $4)
            `;
            for (let i = 0; i < members.length; i++) {
                const mem = members[i];
                await client.query(insertMemText, [
                    newCommitteeId, mem.member_id, mem.role, mem.order_index || i
                ]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Committee created successfully', id: newCommitteeId });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error creating committee:', e);
        res.status(500).json({ error: 'Server error creating committee' });
    } finally {
        client.release();
    }
};

exports.updateCommittee = async (req, res) => {
    const { id } = req.params;
    const { name, start_date, end_date, is_current, members } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (is_current) {
            await client.query('UPDATE committees SET is_current = FALSE WHERE id != $1', [id]);
        }

        const updateCommText = `
            UPDATE committees 
            SET name = $1, start_date = $2, end_date = $3, is_current = $4
            WHERE id = $5
        `;
        await client.query(updateCommText, [
            name, start_date || null, end_date || null, is_current || false, id
        ]);

        // Delete all old members and reinsert
        await client.query('DELETE FROM committee_members WHERE committee_id = $1', [id]);

        if (members && members.length > 0) {
            const insertMemText = `
                INSERT INTO committee_members (committee_id, member_id, role, order_index)
                VALUES ($1, $2, $3, $4)
            `;
            for (let i = 0; i < members.length; i++) {
                const mem = members[i];
                await client.query(insertMemText, [
                    id, mem.member_id, mem.role, mem.order_index || i
                ]);
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Committee updated successfully' });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error updating committee:', e);
        res.status(500).json({ error: 'Server error updating committee' });
    } finally {
        client.release();
    }
};

exports.deleteCommittee = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM committees WHERE id = $1', [id]);
        res.json({ message: 'Committee deleted successfully' });
    } catch (e) {
        console.error('Error deleting committee:', e);
        res.status(500).json({ error: 'Server error deleting committee' });
    }
};

