const { pool } = require('../config/db');

exports.getEminentFigures = async (req, res) => {
    try {
        const query = `
            SELECT ef.id, ef.category, ef.title, ef.reason, ef.institution, ef.member_id,
                   m.full_name, m.name_bangla, m.name_english, m.profile_image_url, m.education, m.occupation,
                   m.present_address, m.permanent_address,
                   v.name as village, di.name as district, u.name as upazila
            FROM eminent_figures ef
            JOIN members m ON ef.member_id = m.id
            LEFT JOIN villages v ON m.village_id = v.id
            LEFT JOIN upazilas u ON COALESCE(m.upazila_id, v.upazila_id) = u.id
            LEFT JOIN districts di ON COALESCE(m.district_id, u.district_id) = di.id
            ORDER BY ef.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching eminent figures:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.addEminentFigure = async (req, res) => {
    const { member_id, category, title, reason, institution } = req.body;
    try {
        const finalTitle = title ? title.trim() : ([reason, institution].filter(Boolean).join(' - ') || null);
        const query = `
            INSERT INTO eminent_figures (member_id, category, title, reason, institution)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await pool.query(query, [
            member_id, 
            category, 
            finalTitle, 
            reason ? reason.trim() : null, 
            institution ? institution.trim() : null
        ]);
        res.status(201).json({ message: 'Added successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error adding eminent figure:', err);
        if (err.code === '23505') { // unique violation
            return res.status(409).json({ error: 'This member is already in this category' });
        }
        res.status(500).json({ error: 'Server error adding figure' });
    }
};

exports.updateEminentFigure = async (req, res) => {
    const { id } = req.params;
    const { category, title, reason, institution } = req.body;
    try {
        const finalTitle = title ? title.trim() : ([reason, institution].filter(Boolean).join(' - ') || null);
        const query = `
            UPDATE eminent_figures
            SET category = $1, title = $2, reason = $3, institution = $4
            WHERE id = $5
            RETURNING *
        `;
        const result = await pool.query(query, [
            category, 
            finalTitle, 
            reason ? reason.trim() : null, 
            institution ? institution.trim() : null, 
            id
        ]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Figure not found' });
        res.json({ message: 'Updated successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error updating eminent figure:', err);
        if (err.code === '23505') { // unique violation
            return res.status(409).json({ error: 'This member is already in this category' });
        }
        res.status(500).json({ error: 'Server error updating figure' });
    }
};

exports.deleteEminentFigure = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM eminent_figures WHERE id = $1', [id]);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting eminent figure:', err);
        res.status(500).json({ error: 'Server error deleting figure' });
    }
};
