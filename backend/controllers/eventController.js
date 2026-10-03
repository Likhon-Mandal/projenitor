const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

exports.getEvents = async (req, res) => {
    try {
        const query = `
            SELECT e.*, COALESCE(m.cnt, 0)::int AS memory_count
            FROM events e
            LEFT JOIN (
                SELECT event_id, COUNT(*) as cnt
                FROM event_memories
                GROUP BY event_id
            ) m ON e.id = m.event_id
            ORDER BY e.date DESC, e.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.addEvent = async (req, res) => {
    const { title, date, time, location, map_link, description } = req.body;

    if (!title || !date) {
        return res.status(400).json({ error: 'Title and date are required' });
    }

    try {
        const query = `
            INSERT INTO events (title, date, time, location, map_link, description)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await pool.query(query, [title, date, time, location, map_link || null, description]);
        res.status(201).json({ message: 'Event added successfully', data: { ...result.rows[0], memory_count: 0 } });
    } catch (err) {
        console.error('Error adding event:', err);
        res.status(500).json({ error: 'Server error adding event' });
    }
};

exports.deleteEvent = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM events WHERE id = $1', [id]);
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ error: 'Server error deleting event' });
    }
};

exports.updateEvent = async (req, res) => {
    const { id } = req.params;
    const { title, date, time, location, map_link, description } = req.body;

    if (!title || !date) {
        return res.status(400).json({ error: 'Title and date are required' });
    }

    try {
        const query = `
            UPDATE events
            SET title = $1, date = $2, time = $3, location = $4, map_link = $5, description = $6
            WHERE id = $7
            RETURNING *
        `;
        const result = await pool.query(query, [title, date, time, location, map_link || null, description, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json({ message: 'Event updated successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ error: 'Server error updating event' });
    }
};

// ---- EVENT MEMORIES (PHOTOS & VIDEOS) ----

exports.getEventMemories = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT * FROM event_memories 
            WHERE event_id = $1 
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching event memories:', err);
        res.status(500).json({ error: 'Server error fetching memories' });
    }
};

exports.addEventMemory = async (req, res) => {
    const { id } = req.params;
    const { media_type, media_url, caption, uploaded_by } = req.body;

    if (!media_url) {
        return res.status(400).json({ error: 'Media URL or file is required' });
    }

    const type = media_type === 'video' ? 'video' : 'photo';
    const uploader = uploaded_by || (req.user ? (req.user.name || req.user.username) : 'Family Member');

    try {
        const query = `
            INSERT INTO event_memories (event_id, media_type, media_url, caption, uploaded_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await pool.query(query, [id, type, media_url, caption || null, uploader]);
        res.status(201).json({ message: 'Memory added successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error adding event memory:', err);
        res.status(500).json({ error: 'Server error adding memory' });
    }
};

exports.deleteEventMemory = async (req, res) => {
    const { id, memoryId } = req.params;
    try {
        const query = 'DELETE FROM event_memories WHERE id = $1 AND event_id = $2 RETURNING *';
        const result = await pool.query(query, [memoryId, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Memory not found' });
        }
        res.json({ message: 'Memory removed successfully' });
    } catch (err) {
        console.error('Error deleting event memory:', err);
        res.status(500).json({ error: 'Server error deleting memory' });
    }
};

