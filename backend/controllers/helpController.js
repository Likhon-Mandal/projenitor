const { pool } = require('../config/db');

exports.getHelpRequests = async (req, res) => {
    try {
        const query = `
            SELECT 
                hr.*,
                COALESCE(hr.help_seeker_id, ms.id) as help_seeker_id,
                COALESCE(hr.posted_by_member_id, mp.id) as posted_by_member_id,
                ms.name_bangla as seeker_name_bangla,
                ms.name_english as seeker_name_english,
                mp.name_bangla as poster_name_bangla,
                mp.name_english as poster_name_english
            FROM help_requests hr
            LEFT JOIN members ms ON (hr.help_seeker_id IS NOT NULL AND hr.help_seeker_id = ms.id)
                OR (hr.help_seeker_id IS NULL AND hr.help_seeker IS NOT NULL AND (
                    LOWER(TRIM(hr.help_seeker)) = LOWER(TRIM(ms.full_name))
                    OR LOWER(TRIM(hr.help_seeker)) = LOWER(TRIM(ms.name_bangla))
                    OR LOWER(TRIM(hr.help_seeker)) = LOWER(TRIM(ms.name_english))
                ))
            LEFT JOIN members mp ON (hr.posted_by_member_id IS NOT NULL AND hr.posted_by_member_id = mp.id)
                OR (hr.posted_by_member_id IS NULL AND hr.posted_by IS NOT NULL AND (
                    LOWER(TRIM(hr.posted_by)) = LOWER(TRIM(mp.full_name))
                    OR LOWER(TRIM(hr.posted_by)) = LOWER(TRIM(mp.name_bangla))
                    OR LOWER(TRIM(hr.posted_by)) = LOWER(TRIM(mp.name_english))
                ))
            ORDER BY hr.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching help requests:', err);
        res.status(500).json({ error: 'Server error fetching help requests' });
    }
};

const isValidUUID = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

exports.addHelpRequest = async (req, res) => {
    let { title, tag, type, content, contact_number, posted_by, help_seeker, help_seeker_id, posted_by_member_id } = req.body;

    if (!title || !tag) {
        return res.status(400).json({ error: 'Title and tag are required' });
    }

    // Determine poster from authenticated user session
    const authUser = req.user;
    if (authUser) {
        if (!posted_by) {
            posted_by = authUser.name || authUser.full_name || authUser.name_bangla || authUser.name_english || 'Member';
        }
        if (!posted_by_member_id && authUser.member_id) {
            posted_by_member_id = authUser.member_id;
        }
    }

    const posted_by_user_id = authUser?.id ? String(authUser.id) : null;

    try {
        let seekerUUID = isValidUUID(help_seeker_id) ? help_seeker_id : null;
        let posterMemberUUID = isValidUUID(posted_by_member_id) ? posted_by_member_id : null;

        // If help_seeker_id is not explicitly provided, try to resolve from members table
        if (!seekerUUID && help_seeker) {
            const mRes = await pool.query(
                `SELECT id FROM members WHERE LOWER(TRIM(full_name)) = LOWER(TRIM($1)) OR LOWER(TRIM(name_bangla)) = LOWER(TRIM($1)) OR LOWER(TRIM(name_english)) = LOWER(TRIM($1)) LIMIT 1`,
                [help_seeker.trim()]
            );
            if (mRes.rows.length > 0) {
                seekerUUID = mRes.rows[0].id;
            }
        }

        // If posted_by_member_id is not explicitly provided, try to resolve from members table
        if (!posterMemberUUID && posted_by) {
            const mRes = await pool.query(
                `SELECT id FROM members WHERE LOWER(TRIM(full_name)) = LOWER(TRIM($1)) OR LOWER(TRIM(name_bangla)) = LOWER(TRIM($1)) OR LOWER(TRIM(name_english)) = LOWER(TRIM($1)) LIMIT 1`,
                [posted_by.trim()]
            );
            if (mRes.rows.length > 0) {
                posterMemberUUID = mRes.rows[0].id;
            }
        }

        const query = `
            INSERT INTO help_requests (
                title, tag, type, content, contact_number, 
                posted_by, help_seeker, help_seeker_id, 
                posted_by_member_id, posted_by_user_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const result = await pool.query(query, [
            title.trim(),
            tag,
            type || 'alert',
            content ? content.trim() : null,
            contact_number ? contact_number.trim() : null,
            posted_by || 'Admin',
            help_seeker ? help_seeker.trim() : null,
            seekerUUID,
            posterMemberUUID,
            posted_by_user_id
        ]);
        res.status(201).json({ message: 'Help request added successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error adding help request:', err);
        res.status(500).json({ error: 'Server error adding help request' });
    }
};

exports.updateHelpRequest = async (req, res) => {
    const { id } = req.params;
    let { title, tag, type, content, contact_number, posted_by, help_seeker, help_seeker_id, posted_by_member_id } = req.body;

    if (!title || !tag) {
        return res.status(400).json({ error: 'Title and tag are required' });
    }

    try {
        let seekerUUID = isValidUUID(help_seeker_id) ? help_seeker_id : null;
        let posterMemberUUID = isValidUUID(posted_by_member_id) ? posted_by_member_id : null;

        if (!seekerUUID && help_seeker) {
            const mRes = await pool.query(
                `SELECT id FROM members WHERE LOWER(TRIM(full_name)) = LOWER(TRIM($1)) OR LOWER(TRIM(name_bangla)) = LOWER(TRIM($1)) OR LOWER(TRIM(name_english)) = LOWER(TRIM($1)) LIMIT 1`,
                [help_seeker.trim()]
            );
            if (mRes.rows.length > 0) {
                seekerUUID = mRes.rows[0].id;
            }
        }

        if (!posterMemberUUID && posted_by) {
            const mRes = await pool.query(
                `SELECT id FROM members WHERE LOWER(TRIM(full_name)) = LOWER(TRIM($1)) OR LOWER(TRIM(name_bangla)) = LOWER(TRIM($1)) OR LOWER(TRIM(name_english)) = LOWER(TRIM($1)) LIMIT 1`,
                [posted_by.trim()]
            );
            if (mRes.rows.length > 0) {
                posterMemberUUID = mRes.rows[0].id;
            }
        }

        const query = `
            UPDATE help_requests
            SET title = $1, tag = $2, type = $3, content = $4, 
                contact_number = $5, posted_by = $6, help_seeker = $7, 
                help_seeker_id = $8, posted_by_member_id = $9
            WHERE id = $10
            RETURNING *
        `;
        const result = await pool.query(query, [
            title.trim(),
            tag,
            type,
            content ? content.trim() : null,
            contact_number ? contact_number.trim() : null,
            posted_by,
            help_seeker ? help_seeker.trim() : null,
            seekerUUID,
            posterMemberUUID,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Help request not found' });
        }
        res.json({ message: 'Help request updated successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error updating help request:', err);
        res.status(500).json({ error: 'Server error updating help request' });
    }
};

exports.deleteHelpRequest = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM help_requests WHERE id = $1', [id]);
        res.json({ message: 'Help request deleted successfully' });
    } catch (err) {
        console.error('Error deleting help request:', err);
        res.status(500).json({ error: 'Server error deleting help request' });
    }
};
