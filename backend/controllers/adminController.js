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
        const result = await pool.query(`
            SELECT a.id, a.email, a.role, a.created_at,
                   COALESCE(a.member_id, u.member_id) as member_id,
                   COALESCE(m.full_name, a.name) as name,
                   COALESCE(m.name_bangla, a.name_bangla) as name_bangla,
                   COALESCE(m.name_english, a.name_english) as name_english,
                   m.profile_image_url
            FROM admin_users a
            LEFT JOIN users u ON LOWER(a.email) = LOWER(u.email)
            LEFT JOIN members m ON COALESCE(a.member_id, u.member_id) = m.id
            ORDER BY a.created_at ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Get admins error:', err);
        res.status(500).json({ error: 'Server error fetching admins' });
    }
};

// ─── Create Admin (SuperAdmin only) ───────────────────────────────────────────
exports.createAdmin = async (req, res) => {
    const { name, email, password, role, member_id } = req.body;
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

        let resolvedMemberId = member_id || null;
        if (!resolvedMemberId) {
            const userMatch = await client.query(
                'SELECT member_id FROM users WHERE LOWER(email) = $1',
                [email.trim().toLowerCase()]
            );
            if (userMatch.rows.length > 0) {
                resolvedMemberId = userMatch.rows[0].member_id;
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await client.query(
            `INSERT INTO admin_users (name, email, password_hash, role, member_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, email, role, member_id, created_at`,
            [name, email.trim().toLowerCase(), hashedPassword, adminRole, resolvedMemberId]
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
            'SELECT id, role, email, member_id FROM admin_users WHERE id = $1',
            [id]
        );
        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Admin not found' });
        }

        // Prevent downgrading or changing role of a SuperAdmin
        if (existing.rows[0].role === 'superadmin' && role && role !== 'superadmin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'SuperAdmin role is permanent and cannot be changed or downgraded.' });
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

// ─── Delete Admin (SuperAdmin only, cannot delete self or superadmin) ──────────
exports.deleteAdmin = async (req, res) => {
    const { id } = req.params;

    // Check if deleting self by ID
    if (id === req.user.id) {
        return res.status(400).json({ error: 'You cannot remove your own admin role' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const target = await client.query(
            'SELECT id, name, email, password_hash, role, member_id, profile_image_url FROM admin_users WHERE id = $1',
            [id]
        );

        if (target.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Admin not found' });
        }

        const targetAdmin = target.rows[0];

        // SuperAdmin can NEVER be deleted or demoted from anywhere!
        if (targetAdmin.role === 'superadmin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'SuperAdmin accounts are protected and cannot be modified or deleted.' });
        }

        // Prevent self-deletion if ID differs but email/member_id matches
        if (
            (req.user.email && targetAdmin.email && req.user.email.toLowerCase() === targetAdmin.email.toLowerCase()) ||
            (req.user.member_id && targetAdmin.member_id && req.user.member_id === targetAdmin.member_id)
        ) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'You cannot remove your own admin role' });
        }

        // 1. Remove from admin_users
        await client.query('DELETE FROM admin_users WHERE id = $1', [id]);

        // Resolve member_id if missing in admin_users record
        let targetMemberId = targetAdmin.member_id;
        if (!targetMemberId && targetAdmin.email) {
            const uMatch = await client.query(
                'SELECT member_id FROM users WHERE LOWER(email) = LOWER($1) AND member_id IS NOT NULL',
                [targetAdmin.email]
            );
            if (uMatch.rows.length > 0) {
                targetMemberId = uMatch.rows[0].member_id;
            }
        }

        // 2. Remove any pending or approved admin role requests for this user
        if (targetAdmin.email || targetMemberId) {
            await client.query(
                `DELETE FROM admin_requests 
                 WHERE (LOWER(email) = LOWER($1) OR user_id IN (
                     SELECT id FROM users WHERE (email IS NOT NULL AND LOWER(email) = LOWER($1)) 
                                             OR ($2::uuid IS NOT NULL AND member_id = $2::uuid)
                 ))`,
                [targetAdmin.email || '', targetMemberId || null]
            );
        }

        // 3. Ensure their user account exists in users table with role 'member', keeping their login credentials intact
        let mobile = null;
        if (targetMemberId) {
            const memRes = await client.query('SELECT contact_number FROM members WHERE id = $1', [targetMemberId]);
            if (memRes.rows.length > 0 && memRes.rows[0].contact_number) {
                mobile = memRes.rows[0].contact_number.split(/[,;\/\n\r]+/)[0]?.trim() || null;
            }
        }

        const existingUser = await client.query(
            `SELECT id, email, password_hash, mobile_number, member_id, status 
             FROM users 
             WHERE (email IS NOT NULL AND LOWER(email) = LOWER($1)) 
                OR ($2::uuid IS NOT NULL AND member_id = $2::uuid)
                OR ($3::varchar IS NOT NULL AND mobile_number = $3)`,
            [targetAdmin.email || '', targetMemberId || null, mobile]
        );

        if (existingUser.rows.length > 0) {
            // Demote role to 'member', preserve password_hash, set status to 'active'
            await client.query(
                `UPDATE users 
                 SET role = 'member',
                     status = 'active',
                     password_hash = COALESCE($1, password_hash),
                     email = COALESCE(email, $3),
                     member_id = COALESCE(member_id, $4),
                     mobile_number = COALESCE(mobile_number, $5)
                 WHERE id = $2 AND role != 'superadmin'`,
                [
                    targetAdmin.password_hash,
                    existingUser.rows[0].id,
                    targetAdmin.email || null,
                    targetMemberId || null,
                    mobile
                ]
            );
        } else {
            // Admin only existed in admin_users; transfer to users as active 'member' with existing password
            let insertMobile = mobile;
            if (insertMobile) {
                const mobCheck = await client.query('SELECT id FROM users WHERE mobile_number = $1', [insertMobile]);
                if (mobCheck.rows.length > 0) {
                    insertMobile = null; // Prevent unique constraint violation
                }
            }

            await client.query(
                `INSERT INTO users (email, password_hash, role, member_id, mobile_number, status)
                 VALUES ($1, $2, 'member', $3, $4, 'active')`,
                [targetAdmin.email || null, targetAdmin.password_hash, targetMemberId || null, insertMobile]
            );
        }

        // NOTE: The main profile in members table is 100% UNTOUCHED!
        await client.query('COMMIT');
        res.json({ message: `Admin privileges removed for '${targetAdmin.name}'. Account is now a normal user.` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete admin error:', err);
        res.status(500).json({ error: 'Server error removing admin privileges' });
    } finally {
        client.release();
    }
};

// ─── Get All Users (Admin) ────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.member_id, u.mobile_number, u.email, u.status, u.role, u.created_at,
                   m.full_name as member_name, m.name_bangla, m.name_english, m.profile_image_url
            FROM users u
            LEFT JOIN members m ON u.member_id = m.id
            ORDER BY u.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

// ─── Update User Status (Admin) ───────────────────────────────────────────────
exports.updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected', 'active'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check target user
        const targetRes = await client.query(
            'SELECT id, role, email, member_id, mobile_number FROM users WHERE id = $1',
            [id]
        );

        if (targetRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }

        const targetUser = targetRes.rows[0];

        // 1. SuperAdmin status cannot be modified
        if (targetUser.role === 'superadmin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'SuperAdmin status is permanent and cannot be modified.' });
        }

        const superAdminCheck = await client.query(
            `SELECT id FROM admin_users 
             WHERE role = 'superadmin' 
               AND (
                 (email IS NOT NULL AND LOWER(email) = LOWER($1))
                 OR (member_id IS NOT NULL AND member_id = $2)
               )`,
            [targetUser.email || '', targetUser.member_id || null]
        );

        if (superAdminCheck.rowCount > 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'SuperAdmin status is permanent and cannot be modified.' });
        }

        // 2. Regular admin cannot change status of another admin
        if (req.user.role !== 'superadmin' && targetUser.role === 'admin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Only SuperAdmins can modify the status of admin accounts.' });
        }

        const result = await client.query(
            'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, member_id, mobile_number, email, status',
            [status, id]
        );

        const user = result.rows[0];

        // When a user account request is accepted/approved/active,
        // if the member already has this number, keep it unchanged;
        // if user activates with another number, append it to their profile.
        if (['approved', 'active'].includes(status) && user.member_id && user.mobile_number) {
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
        res.json({ message: `User status updated to ${status}`, user });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update user status error:', err);
        res.status(500).json({ error: 'Server error updating user status' });
    } finally {
        client.release();
    }
};

// ─── Update User Mobile (Admin) ───────────────────────────────────────────────
exports.updateUserMobile = async (req, res) => {
    const { id } = req.params;
    const { mobile_number } = req.body;
    
    if (!mobile_number) return res.status(400).json({ error: 'Mobile number is required' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            'UPDATE users SET mobile_number = $1 WHERE id = $2 RETURNING id, member_id, mobile_number, status',
            [mobile_number, id]
        );
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // If user is approved or active, sync member profile contact number as well (append if not present)
        if (user.member_id && ['approved', 'active'].includes(user.status)) {
            const memRes = await client.query('SELECT contact_number FROM members WHERE id = $1', [user.member_id]);
            if (memRes.rowCount > 0) {
                const existingContact = memRes.rows[0].contact_number || '';
                const numbers = existingContact
                    .split(/[,;\/\n\r]+/)
                    .map(n => n.trim())
                    .filter(Boolean);
                const digits = (str) => (str || '').replace(/[^0-9]/g, '');
                const targetDigits = digits(mobile_number);
                const exists = numbers.some(n => {
                    const d = digits(n);
                    return d === targetDigits || (d.length >= 10 && targetDigits.length >= 10 && (d.endsWith(targetDigits) || targetDigits.endsWith(d))) || n === mobile_number;
                });
                let updatedContact = existingContact;
                if (!exists) {
                    numbers.push(mobile_number);
                    updatedContact = numbers.join(', ');
                }
                await client.query(
                    'UPDATE members SET contact_number = $1, updated_at = NOW() WHERE id = $2',
                    [updatedContact, user.member_id]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'User mobile number updated', user });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update user mobile error:', err);
        if (err.code === '23505') return res.status(409).json({ error: 'Mobile number already in use' });
        res.status(500).json({ error: 'Server error updating mobile number' });
    } finally {
        client.release();
    }
};

// ─── Delete User (SuperAdmin only) ──────────────────────────────────────────
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    // 1. Only SuperAdmins can delete user accounts
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Only SuperAdmins can delete user accounts.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 2. Fetch target user
        const targetRes = await client.query(
            'SELECT id, role, email, mobile_number, member_id FROM users WHERE id = $1',
            [id]
        );

        if (targetRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }

        const targetUser = targetRes.rows[0];

        // 3. SuperAdmin accounts CANNOT be deleted under any circumstances
        if (targetUser.role === 'superadmin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'SuperAdmin accounts are protected and cannot be deleted.' });
        }

        const superAdminCheck = await client.query(
            `SELECT id FROM admin_users 
             WHERE role = 'superadmin' 
               AND (
                 (email IS NOT NULL AND LOWER(email) = LOWER($1))
                 OR (member_id IS NOT NULL AND member_id = $2)
               )`,
            [targetUser.email || '', targetUser.member_id || null]
        );

        if (superAdminCheck.rowCount > 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'SuperAdmin accounts are protected and cannot be deleted.' });
        }

        // 4. Prevent self-deletion
        const isSelf = (req.user.id && req.user.id === targetUser.id) ||
                       (req.user.email && targetUser.email && req.user.email.toLowerCase() === targetUser.email.toLowerCase()) ||
                       (req.user.member_id && targetUser.member_id && req.user.member_id === targetUser.member_id);

        if (isSelf) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'You cannot delete your own account.' });
        }

        // Resolve member_id if missing in user record but linked by contact number
        let targetMemberId = targetUser.member_id;
        if (!targetMemberId && targetUser.mobile_number) {
            const memMatch = await client.query('SELECT id FROM members WHERE contact_number ILIKE $1', [`%${targetUser.mobile_number}%`]);
            if (memMatch.rows.length > 0) {
                targetMemberId = memMatch.rows[0].id;
            }
        }

        // 5. Check any email registered in admin requests for this user
        const reqEmailRes = await client.query('SELECT email FROM admin_requests WHERE user_id = $1', [id]);
        const requestEmail = reqEmailRes.rows[0]?.email || null;

        // 6. If target user has admin role or exists in admin_users, revoke/delete their admin role (never superadmin)
        if (targetUser.email || requestEmail || targetMemberId) {
            await client.query(
                `DELETE FROM admin_users 
                 WHERE ((email IS NOT NULL AND (LOWER(email) = LOWER($1) OR (LOWER(email) = LOWER($2) AND $2 IS NOT NULL))) 
                        OR ($3::uuid IS NOT NULL AND member_id = $3::uuid))
                   AND role != 'superadmin'`,
                [targetUser.email || '', requestEmail || '', targetMemberId || null]
            );
        }

        // 7. Delete any admin role requests associated with this user
        await client.query(
            'DELETE FROM admin_requests WHERE user_id = $1 OR (email IS NOT NULL AND (LOWER(email) = LOWER($2) OR (LOWER(email) = LOWER($3) AND $3 IS NOT NULL)))',
            [id, targetUser.email || '', requestEmail || '']
        );

        // 8. Delete the login number from his/her member profile if it was added or exists
        if (targetMemberId && targetUser.mobile_number) {
            const memRes = await client.query('SELECT contact_number FROM members WHERE id = $1', [targetMemberId]);
            if (memRes.rowCount > 0 && memRes.rows[0].contact_number) {
                const existingContact = memRes.rows[0].contact_number;
                const numbers = existingContact
                    .split(/[,;\/\n\r]+/)
                    .map(n => n.trim())
                    .filter(Boolean);
                
                const digits = (str) => (str || '').replace(/[^0-9]/g, '');
                const targetDigits = digits(targetUser.mobile_number);

                const remainingNumbers = numbers.filter(n => {
                    const d = digits(n);
                    const isMatch = (targetDigits && d === targetDigits) ||
                                    (d.length >= 10 && targetDigits.length >= 10 && (d.endsWith(targetDigits) || targetDigits.endsWith(d))) ||
                                    n === targetUser.mobile_number;
                    return !isMatch;
                });

                const updatedContact = remainingNumbers.length > 0 ? remainingNumbers.join(', ') : null;

                await client.query(
                    'UPDATE members SET contact_number = $1, updated_at = NOW() WHERE id = $2',
                    [updatedContact, targetMemberId]
                );
            }
        }

        // 9. Delete the user authentication record from users table
        // This inactivates the account, frees the member profile, and makes it ready to be claimed/activated again
        await client.query('DELETE FROM users WHERE id = $1', [id]);

        await client.query('COMMIT');

        res.json({ 
            message: 'User account deleted successfully. Administrative privileges revoked, login number removed from member profile, and profile is ready for re-activation.',
            deletedUserId: id,
            memberId: targetMemberId
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Server error deleting user' });
    } finally {
        client.release();
    }
};

// ─── Get Admin Role Requests (SuperAdmin only) ──────────────────────────────
exports.getAdminRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ar.id, ar.user_id, u.member_id, ar.email, ar.status, ar.created_at,
                   u.mobile_number, u.role as current_role,
                   m.full_name as member_name, m.name_bangla, m.name_english, m.profile_image_url
            FROM admin_requests ar
            JOIN users u ON ar.user_id = u.id
            LEFT JOIN members m ON u.member_id = m.id
            ORDER BY ar.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Get admin requests error:', err);
        res.status(500).json({ error: 'Server error fetching admin requests' });
    }
};

// ─── Handle Admin Role Request (Approve / Reject) (SuperAdmin only) ─────────
exports.handleAdminRequest = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const requestResult = await client.query(
            'SELECT id, user_id, email, status FROM admin_requests WHERE id = $1',
            [id]
        );

        if (requestResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Admin request not found' });
        }

        const adminReq = requestResult.rows[0];
        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        await client.query(
            'UPDATE admin_requests SET status = $1 WHERE id = $2',
            [newStatus, id]
        );

        if (action === 'approve') {
            // Upgrade user role to 'admin' in users table
            await client.query(
                "UPDATE users SET role = 'admin', email = COALESCE(email, $1) WHERE id = $2",
                [adminReq.email, adminReq.user_id]
            );

            // Sync with admin_users table as well
            const userRes = await client.query(`
                SELECT u.id, u.email, u.password_hash, u.member_id, m.full_name
                FROM users u
                LEFT JOIN members m ON u.member_id = m.id
                WHERE u.id = $1`,
                [adminReq.user_id]
            );

            if (userRes.rowCount > 0) {
                const u = userRes.rows[0];
                const existingAdmin = await client.query(
                    'SELECT id FROM admin_users WHERE LOWER(email) = LOWER($1)',
                    [adminReq.email]
                );
                if (existingAdmin.rowCount === 0) {
                    await client.query(`
                        INSERT INTO admin_users (name, email, password_hash, role, member_id)
                        VALUES ($1, $2, $3, 'admin', $4)`,
                        [u.full_name || 'Admin', adminReq.email, u.password_hash, u.member_id]
                    );
                } else {
                    await client.query(`
                        UPDATE admin_users SET role = 'admin', member_id = COALESCE(member_id, $1)
                        WHERE LOWER(email) = LOWER($2)`,
                        [u.member_id, adminReq.email]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: `Admin request ${action}d successfully` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Handle admin request error:', err);
        res.status(500).json({ error: 'Server error processing admin request' });
    } finally {
        client.release();
    }
};
