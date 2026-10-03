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

        let result;
        if (decoded.is_normal_user) {
            result = await pool.query(`
                SELECT u.id, u.mobile_number, u.email, u.role, u.member_id,
                       m.full_name as name, m.full_name, m.name_bangla, m.name_english, m.profile_image_url
                FROM users u
                LEFT JOIN members m ON u.member_id = m.id
                WHERE u.id = $1`,
                [decoded.id]
            );
        } else {
            result = await pool.query(`
                SELECT a.id, a.email, a.role,
                       COALESCE(a.member_id, u.member_id) as member_id,
                       COALESCE(m.full_name, a.name) as name,
                       COALESCE(m.full_name, a.name) as full_name,
                       COALESCE(m.name_bangla, a.name_bangla) as name_bangla,
                       COALESCE(m.name_english, a.name_english) as name_english,
                       COALESCE(m.profile_image_url, a.profile_image_url) as profile_image_url,
                       COALESCE(m.contact_number, u.mobile_number) as mobile_number
                FROM admin_users a
                LEFT JOIN users u ON LOWER(a.email) = LOWER(u.email)
                LEFT JOIN members m ON COALESCE(a.member_id, u.member_id) = m.id
                WHERE a.id = $1`,
                [decoded.id]
            );
        }

        if (result.rows.length === 0) {
            // Fallback check in users table if not found in admin_users
            result = await pool.query(`
                SELECT u.id, u.mobile_number, u.email, u.role, u.member_id,
                       m.full_name as name, m.full_name, m.name_bangla, m.name_english, m.profile_image_url
                FROM users u
                LEFT JOIN members m ON u.member_id = m.id
                WHERE u.id = $1`,
                [decoded.id]
            );
            if (result.rows.length > 0) {
                req.user = result.rows[0];
                req.user.is_normal_user = true;
                return next();
            }
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        }

        req.user = result.rows[0];
        req.user.is_normal_user = !!decoded.is_normal_user;
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
