const { pool } = require('../config/db');

exports.getEminentFigures = async (req, res) => {
    try {
        const query = `
            SELECT ef.id, ef.category, ef.title, ef.member_id,
                   m.full_name, m.name_bangla, m.name_english, m.profile_image_url, m.education, m.occupation
            FROM eminent_figures ef
            JOIN members m ON ef.member_id = m.id
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
    const { member_id, category, title } = req.body;
    try {
        const query = `
            INSERT INTO eminent_figures (member_id, category, title)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await pool.query(query, [member_id, category, title || null]);
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
    const { category, title } = req.body;
    try {
        const query = `
            UPDATE eminent_figures
            SET category = $1, title = $2
            WHERE id = $3
            RETURNING *
        `;
        const result = await pool.query(query, [category, title || null, id]);
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
