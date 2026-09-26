const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Middleware: Verify JWT and attach user info to req.user
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey_projenitor_123');

        // Verify user still exists in DB
        const result = await pool.query(
            'SELECT id, name, name_bangla, name_english, email, role, profile_image_url FROM admin_users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        }

        req.user = result.rows[0];
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Unauthorized: Token expired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Server error during authentication' });
    }
};

/**
 * Middleware: Require admin or superadmin role
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: Not authenticated' });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};

/**
 * Middleware: Require superadmin role only
 */
const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: Not authenticated' });
    }
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: SuperAdmin access required' });
    }
    next();
};

module.exports = { authenticate, requireAdmin, requireSuperAdmin };
