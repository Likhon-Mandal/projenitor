const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

// ─── Get Dashboard Stats ──────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
    try {
        const [members, homes, villages, events, notices, eminent, admins] = await Promise.all([
            pool.query("SELECT COUNT(*) FROM members WHERE deleted_at IS NULL"),
            pool.query("SELECT COUNT(*) FROM homes WHERE deleted_at IS NULL"),
            pool.query("SELECT COUNT(*) FROM villages WHERE deleted_at IS NULL"),
            pool.query("SELECT COUNT(*) FROM events"),
            pool.query("SELECT COUNT(*) FROM notices"),
            pool.query("SELECT COUNT(*) FROM eminent_figures"),
            pool.query("SELECT COUNT(*) FROM admin_users"),
        ]);

        res.json({
            totalMembers: parseInt(members.rows[0].count),
            totalHomes: parseInt(homes.rows[0].count),
            totalVillages: parseInt(villages.rows[0].count),
            totalEvents: parseInt(events.rows[0].count),
            totalNotices: parseInt(notices.rows[0].count),
            totalEminentFigures: parseInt(eminent.rows[0].count),
            totalAdmins: parseInt(admins.rows[0].count),
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ error: 'Server error fetching stats' });
    }
};

// ─── Get Chart Data ───────────────────────────────────────────────────────────
exports.getChartData = async (req, res) => {
    try {
        const [registrations, villages, bloodGroups] = await Promise.all([
            // Monthly member registrations (limit to last 12 months for better view)
            pool.query(`
                SELECT TO_CHAR(created_at, 'Mon') as month, COUNT(*) as count, DATE_TRUNC('month', created_at) as month_date
                FROM members
                WHERE deleted_at IS NULL
                GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
                ORDER BY DATE_TRUNC('month', created_at) ASC
                LIMIT 12
            `),
            // Top 8 villages by member count
            pool.query(`
                SELECT v.name as name, COUNT(m.id) as count
                FROM members m
                JOIN villages v ON m.village_id = v.id
                WHERE m.deleted_at IS NULL
                GROUP BY v.name
                ORDER BY count DESC
                LIMIT 8
            `),
            // Blood group distribution
            pool.query(`
                SELECT blood_group as name, COUNT(*) as count
                FROM members
                WHERE blood_group IS NOT NULL AND deleted_at IS NULL
                GROUP BY blood_group
                ORDER BY count DESC
            `)
        ]);

        res.json({
            registrations: registrations.rows.map(r => ({ name: r.month, members: parseInt(r.count) })),
            villages: villages.rows.map(v => ({ name: v.name, value: parseInt(v.count) })),
            bloodGroups: bloodGroups.rows.map(b => ({ name: b.name, value: parseInt(b.count) }))
        });
    } catch (err) {
        console.error('Chart data error:', err);
        res.status(500).json({ error: 'Server error fetching chart data' });
    }
};

// ─── Get All Admins (SuperAdmin only) ─────────────────────────────────────────
exports.getAdmins = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, created_at FROM admin_users ORDER BY created_at ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get admins error:', err);
        res.status(500).json({ error: 'Server error fetching admins' });
    }
};

// ─── Create Admin (SuperAdmin only) ───────────────────────────────────────────
exports.createAdmin = async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const allowedRoles = ['admin', 'superadmin'];
    const adminRole = allowedRoles.includes(role) ? role : 'admin';

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const existing = await client.query(
            'SELECT id FROM admin_users WHERE email = $1',
            [email.trim().toLowerCase()]
        );
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'An admin with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await client.query(
            `INSERT INTO admin_users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
            [name, email.trim().toLowerCase(), hashedPassword, adminRole]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'Admin created successfully', admin: result.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create admin error:', err);
        res.status(500).json({ error: 'Server error creating admin' });
    } finally {
        client.release();
    }
};

// ─── Update Admin (SuperAdmin only) ───────────────────────────────────────────
exports.updateAdmin = async (req, res) => {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    const allowedRoles = ['admin', 'superadmin'];
    if (role && !allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const existing = await client.query(
            'SELECT id, role FROM admin_users WHERE id = $1',
            [id]
        );
        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Admin not found' });
        }

        let updateQuery = `UPDATE admin_users SET name = $1, email = $2, role = $3`;
        let params = [name, email ? email.trim().toLowerCase() : existing.rows[0].email, role || existing.rows[0].role];

        if (password) {
            if (password.length < 6) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateQuery += `, password_hash = $${params.length + 1}`;
            params.push(hashedPassword);
        }

        updateQuery += ` WHERE id = $${params.length + 1} RETURNING id, name, email, role, created_at`;
        params.push(id);

        const result = await client.query(updateQuery, params);
        await client.query('COMMIT');

        res.json({ message: 'Admin updated successfully', admin: result.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update admin error:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Email already used by another admin' });
        }
        res.status(500).json({ error: 'Server error updating admin' });
    } finally {
        client.release();
    }
};

// ─── Delete Admin (SuperAdmin only, cannot delete self) ───────────────────────
exports.deleteAdmin = async (req, res) => {
    const { id } = req.params;

    if (id === req.user.id) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            'DELETE FROM admin_users WHERE id = $1 RETURNING id, name, email',
            [id]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Admin not found' });
        }

        await client.query('COMMIT');
        res.json({ message: `Admin '${result.rows[0].name}' deleted successfully` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete admin error:', err);
        res.status(500).json({ error: 'Server error deleting admin' });
    } finally {
        client.release();
    }
};
