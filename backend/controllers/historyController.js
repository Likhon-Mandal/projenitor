const { pool } = require('../config/db');

exports.getHistoryRecords = async (req, res) => {
    try {
        const query = 'SELECT * FROM history_records ORDER BY display_order ASC, id ASC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching history records:', err);
        res.status(500).json({ error: 'Server error fetching history records' });
    }
};

exports.addHistoryRecord = async (req, res) => {
    const { title_bn, title_en, content_bn, content_en, display_order, is_lead } = req.body;
    try {
        if (!content_bn || !content_bn.trim()) {
            return res.status(400).json({ error: 'বাংলা বিবরণ/লেখা আবশ্যক (Bengali content is required)' });
        }

        // Determine default display_order if not provided
        let order = display_order;
        if (order === undefined || order === null || order === '') {
            const maxOrderRes = await pool.query('SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM history_records');
            order = maxOrderRes.rows[0].next_order;
        }

        const query = `
            INSERT INTO history_records (title_bn, title_en, content_bn, content_en, display_order, is_lead)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await pool.query(query, [
            title_bn?.trim() || null,
            title_en?.trim() || null,
            content_bn.trim(),
            content_en?.trim() || null,
            parseInt(order, 10) || 0,
            Boolean(is_lead)
        ]);
        res.status(201).json({ message: 'History section added successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error adding history record:', err);
        res.status(500).json({ error: 'Server error adding history record' });
    }
};

exports.updateHistoryRecord = async (req, res) => {
    const { id } = req.params;
    const { title_bn, title_en, content_bn, content_en, display_order, is_lead } = req.body;

    try {
        if (!content_bn || !content_bn.trim()) {
            return res.status(400).json({ error: 'বাংলা বিবরণ/লেখা আবশ্যক (Bengali content is required)' });
        }

        const query = `
            UPDATE history_records
            SET title_bn = $1,
                title_en = $2,
                content_bn = $3,
                content_en = $4,
                display_order = $5,
                is_lead = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
        `;
        const result = await pool.query(query, [
            title_bn !== undefined ? (title_bn?.trim() || null) : null,
            title_en !== undefined ? (title_en?.trim() || null) : null,
            content_bn.trim(),
            content_en !== undefined ? (content_en?.trim() || null) : null,
            parseInt(display_order, 10) || 0,
            Boolean(is_lead),
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'History record not found' });
        }

        res.json({ message: 'History section updated successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error updating history record:', err);
        res.status(500).json({ error: 'Server error updating history record' });
    }
};

exports.deleteHistoryRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM history_records WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'History record not found' });
        }
        res.json({ message: 'History section deleted successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error deleting history record:', err);
        res.status(500).json({ error: 'Server error deleting history record' });
    }
};
