const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_projenitor_123';
const TOKEN_EXPIRY = '7d';

// ─── Registration Request ───────────────────────────────────────────────────
exports.registerRequest = async (req, res) => {
    const { mobile_number, email, member_id } = req.body;
    
    if (!mobile_number || !member_id) {
        return res.status(400).json({ error: 'Mobile number and member selection are required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Clean up previously rejected requests so users can re-apply
        await client.query("DELETE FROM users WHERE (member_id = $1 OR mobile_number = $2) AND status = 'rejected'", [member_id, mobile_number]);

        // Check if an active or pending request/account already exists for this member
        const existingMember = await client.query('SELECT id, status FROM users WHERE member_id = $1', [member_id]);
        if (existingMember.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: `An account with status '${existingMember.rows[0].status}' already exists for this member` });
        }

        // Check if mobile number is already used
        const existingMobile = await client.query('SELECT id, status FROM users WHERE mobile_number = $1', [mobile_number]);
        if (existingMobile.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'This mobile number is already registered' });
        }

        const result = await client.query(
            `INSERT INTO users (mobile_number, email, member_id, status, role)
             VALUES ($1, $2, $3, 'pending', 'member') RETURNING id`,
            [mobile_number, email || null, member_id]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'Registration request submitted successfully', userId: result.rows[0].id });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error during registration' });
    } finally {
        client.release();
    }
};

// ─── Check Status ───────────────────────────────────────────────────────────
exports.checkStatus = async (req, res) => {
    const { mobile_number } = req.body;
    if (!mobile_number) return res.status(400).json({ error: 'Mobile number or Email is required' });

    try {
        const queryTerm = mobile_number.trim().toLowerCase();
        const result = await pool.query(
            'SELECT id, status, password_hash FROM users WHERE LOWER(mobile_number) = $1 OR LOWER(email) = $1',
            [queryTerm]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No account found with this mobile number or email' });
        }
        
        const user = result.rows[0];
        const needsPassword = user.status === 'approved' && !user.password_hash;
        
        res.json({ status: user.status, needsPassword, userId: user.id });
    } catch (err) {
        console.error('Check status error:', err);
        res.status(500).json({ error: 'Server error checking status' });
    }
};

// ─── Set Password ───────────────────────────────────────────────────────────
exports.setPassword = async (req, res) => {
    const { mobile_number, password } = req.body;
    if (!mobile_number || !password) return res.status(400).json({ error: 'Mobile number and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const queryTerm = mobile_number.trim().toLowerCase();
        const result = await client.query(
            'SELECT id, member_id, mobile_number, email, status, password_hash FROM users WHERE LOWER(mobile_number) = $1 OR LOWER(email) = $1',
            [queryTerm]
        );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = result.rows[0];
        if (user.status !== 'approved') {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Account is not yet approved by an admin' });
        }
        if (user.password_hash) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Password is already set. Please login.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await client.query(
            "UPDATE users SET password_hash = $1, status = 'active' WHERE id = $2",
            [hashedPassword, user.id]
        );

        // Ensure the active user's mobile number is present in member profile (append if not already there)
        if (user.member_id && user.mobile_number) {
            const memRes = await client.query('SELECT contact_number FROM members WHERE id = $1', [user.member_id]);
            if (memRes.rowCount > 0) {
                const existingContact = memRes.rows[0].contact_number || '';
                const numbers = existingContact
                    .split(/[,;\/\n\r]+/)
                    .map(n => n.trim())
                    .filter(Boolean);
                
                const digits = (str) => (str || '').replace(/[^0-9]/g, '');
                const targetDigits = digits(user.mobile_number);
                const exists = numbers.some(n => {
                    const d = digits(n);
                    return d === targetDigits || (d.length >= 10 && targetDigits.length >= 10 && (d.endsWith(targetDigits) || targetDigits.endsWith(d))) || n === user.mobile_number;
                });

                let updatedContact = existingContact;
                if (!exists) {
                    numbers.push(user.mobile_number);
                    updatedContact = numbers.join(', ');
                }

                await client.query(
                    `UPDATE members 
                     SET contact_number = $1,
                         email = COALESCE(email, $2),
                         updated_at = NOW()
                     WHERE id = $3`,
                    [updatedContact, user.email || null, user.member_id]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Password set successfully. You can now login.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Set password error:', err);
        res.status(500).json({ error: 'Server error setting password' });
    } finally {
        client.release();
    }
};

// ─── Login ──────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    const { mobile_number, password } = req.body;
    if (!mobile_number || !password) return res.status(400).json({ error: 'Mobile number/Email and password are required' });

    try {
        const queryTerm = mobile_number.trim().toLowerCase();
        const result = await pool.query(`
            SELECT u.id, u.mobile_number, u.email, u.password_hash, u.role, u.status, u.member_id,
                   m.full_name, m.name_bangla, m.name_english, m.profile_image_url
            FROM users u
            LEFT JOIN members m ON u.member_id = m.id
            WHERE LOWER(u.mobile_number) = $1 OR LOWER(u.email) = $1`, 
            [queryTerm]
        );

        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = result.rows[0];
        if (user.status !== 'active') return res.status(403).json({ error: `Account status is ${user.status}` });

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, role: user.role, member_id: user.member_id, is_normal_user: true },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        res.json({
            token,
            user: {
                id: user.id,
                mobile_number: user.mobile_number,
                email: user.email,
                role: user.role,
                member_id: user.member_id,
                full_name: user.full_name,
                name_bangla: user.name_bangla,
                name_english: user.name_english,
                name: user.full_name,
                member_name: user.full_name,
                profile_image_url: user.profile_image_url
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// ─── Request Admin Role ───────────────────────────────────────────────────────
exports.requestAdmin = async (req, res) => {
    const { email } = req.body;
    const userId = req.user?.id;

    // Use provided email or fallback to existing user email in database
    const effectiveEmail = (email || req.user?.email)?.trim()?.toLowerCase();

    if (!effectiveEmail) {
        return res.status(400).json({ error: 'Email is required to request an Admin role' });
    }

    try {
        const existing = await pool.query(
            'SELECT id, status FROM admin_requests WHERE user_id = $1 AND status = $2',
            [userId, 'pending']
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'You already have a pending request for the Admin role' });
        }

        // If user didn't have an email registered earlier, save it now
        if (!req.user?.email && effectiveEmail) {
            await pool.query('UPDATE users SET email = $1 WHERE id = $2', [effectiveEmail, userId]);
        }

        await pool.query(
            'INSERT INTO admin_requests (user_id, email, status) VALUES ($1, $2, $3)',
            [userId, effectiveEmail, 'pending']
        );
        res.status(200).json({ 
            message: 'Admin role request submitted successfully',
            email: effectiveEmail
        });
    } catch (err) {
        console.error('Request admin error:', err);
        res.status(500).json({ error: 'Server error requesting admin role' });
    }
};

// ─── Get Admin Request Status for Current User ──────────────────────────────
exports.getAdminRequestStatus = async (req, res) => {
    const userId = req.user?.id;
    try {
        const result = await pool.query(
            'SELECT id, email, status, created_at FROM admin_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
        if (result.rows.length === 0) {
            return res.json({ hasRequest: false, request: null });
        }
        res.json({ hasRequest: true, request: result.rows[0] });
    } catch (err) {
        console.error('Get admin request status error:', err);
        res.status(500).json({ error: 'Server error fetching admin request status' });
    }
};

// ─── Get Current User Profile ───────────────────────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.mobile_number, u.email, u.role, u.status, u.member_id,
                   m.full_name as name, m.full_name, m.profile_image_url
            FROM users u
            LEFT JOIN members m ON u.member_id = m.id
            WHERE u.id = $1`,
            [req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ error: 'Server error fetching user profile' });
    }
};
