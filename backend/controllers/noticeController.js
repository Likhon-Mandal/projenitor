const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

exports.getNotices = async (req, res) => {
    try {
        const query = 'SELECT * FROM notices ORDER BY date DESC, created_at DESC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching notices:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.addNotice = async (req, res) => {
    const { title, type, content, date, posted_by } = req.body;
    try {
        const query = `
            INSERT INTO notices (title, type, content, date, posted_by)
            VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), COALESCE($5, 'Admin'))
            RETURNING *
        `;
        const result = await pool.query(query, [title, type, content, date || null, posted_by]);
        res.status(201).json({ message: 'Added successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error adding notice:', err);
        res.status(500).json({ error: 'Server error adding notice' });
    }
};

exports.deleteNotice = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM notices WHERE id = $1', [id]);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting notice:', err);
        res.status(500).json({ error: 'Server error deleting notice' });
    }
};

exports.updateNotice = async (req, res) => {
    const { id } = req.params;
    const { title, type, content, date, posted_by } = req.body;
    try {
        const query = `
            UPDATE notices
            SET title = $1, type = $2, content = $3, date = COALESCE($4, date, CURRENT_DATE), posted_by = COALESCE($5, posted_by, 'Admin')
            WHERE id = $6
            RETURNING *
        `;
        const result = await pool.query(query, [title, type, content, date || null, posted_by, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notice not found' });
        }
        res.json({ message: 'Updated successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error updating notice:', err);
        res.status(500).json({ error: 'Server error updating notice' });
    }
};
