const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_projenitor_123';
const TOKEN_EXPIRY = '7d';

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let result = await client.query(`
      SELECT a.id, a.email, a.password_hash, a.role,
             COALESCE(a.member_id, u.member_id) as member_id,
             COALESCE(m.full_name, a.name) as name,
             COALESCE(m.name_bangla, a.name_bangla) as name_bangla,
             COALESCE(m.name_english, a.name_english) as name_english,
             COALESCE(m.profile_image_url, a.profile_image_url) as profile_image_url
      FROM admin_users a
      LEFT JOIN users u ON LOWER(a.email) = LOWER(u.email)
      LEFT JOIN members m ON COALESCE(a.member_id, u.member_id) = m.id
      WHERE LOWER(a.email) = $1`,
      [email.trim().toLowerCase()]
    );

    let isNormalUser = false;
    let memberId = null;

    if (result.rows.length === 0) {
      result = await client.query(`
        SELECT u.id, m.full_name as name, m.name_bangla, m.name_english,
               u.email, u.password_hash, u.role, m.profile_image_url, u.member_id
        FROM users u
        LEFT JOIN members m ON u.member_id = m.id
        WHERE (LOWER(u.email) = $1 OR LOWER(u.mobile_number) = $1) AND u.status = 'active'`,
        [email.trim().toLowerCase()]
      );
      if (result.rows.length > 0) {
        isNormalUser = true;
        memberId = result.rows[0].member_id;
      }
    } else {
      memberId = result.rows[0].member_id;
    }

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, is_normal_user: isNormalUser, member_id: memberId },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    await client.query('COMMIT');

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        name_bangla: user.name_bangla,
        name_english: user.name_english,
        email: user.email,
        role: user.role,
        member_id: memberId,
        profile_image_url: user.profile_image_url
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  } finally {
    client.release();
  }
};

// ─── Get Current User ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'SELECT id, email FROM admin_users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    // Always respond the same to prevent email enumeration
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({ message: 'If this email exists, a reset token has been generated.' });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await client.query(
      'UPDATE admin_users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetTokenExpires, user.id]
    );

    await client.query('COMMIT');

    // In dev mode, return the token directly (no email sending)
    res.json({
      message: 'Reset token generated. Use it within 1 hour.',
      resetToken // ⚠️ DEV MODE: In production, send this via email
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT id, email FROM admin_users
       WHERE reset_token = $1
         AND reset_token_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await client.query(
      `UPDATE admin_users
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
       WHERE id = $2`,
      [hashedPassword, result.rows[0].id]
    );

    if (result.rows[0].email) {
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2)',
        [hashedPassword, result.rows[0].email]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// ─── Change Password (Authenticated) ─────────────────────────────────────────
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old and new passwords are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let userRecord = null;
    let userTable = null; // 'admin_users' | 'users'

    // 1. Try to find user in primary table based on is_normal_user flag
    if (req.user?.is_normal_user) {
      const userRes = await client.query(
        'SELECT id, email, password_hash FROM users WHERE id = $1',
        [req.user.id]
      );
      if (userRes.rows.length > 0) {
        userRecord = userRes.rows[0];
        userTable = 'users';
      }
    } else {
      const adminRes = await client.query(
        'SELECT id, email, password_hash FROM admin_users WHERE id = $1',
        [req.user.id]
      );
      if (adminRes.rows.length > 0) {
        userRecord = adminRes.rows[0];
        userTable = 'admin_users';
      }
    }

    // 2. Fallback search by ID in the other table
    if (!userRecord) {
      const adminRes = await client.query(
        'SELECT id, email, password_hash FROM admin_users WHERE id = $1',
        [req.user.id]
      );
      if (adminRes.rows.length > 0) {
        userRecord = adminRes.rows[0];
        userTable = 'admin_users';
      } else {
        const userRes = await client.query(
          'SELECT id, email, password_hash FROM users WHERE id = $1',
          [req.user.id]
        );
        if (userRes.rows.length > 0) {
          userRecord = userRes.rows[0];
          userTable = 'users';
        }
      }
    }

    // 3. Fallback search by email if still not found
    if (!userRecord && req.user?.email) {
      const adminByEmail = await client.query(
        'SELECT id, email, password_hash FROM admin_users WHERE LOWER(email) = LOWER($1)',
        [req.user.email.trim()]
      );
      if (adminByEmail.rows.length > 0) {
        userRecord = adminByEmail.rows[0];
        userTable = 'admin_users';
      } else {
        const userByEmail = await client.query(
          'SELECT id, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
          [req.user.email.trim()]
        );
        if (userByEmail.rows.length > 0) {
          userRecord = userByEmail.rows[0];
          userTable = 'users';
        }
      }
    }

    if (!userRecord) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User account not found' });
    }

    if (!userRecord.password_hash) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No password is set on this account' });
    }

    const valid = await bcrypt.compare(oldPassword, userRecord.password_hash);
    if (!valid) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update primary record
    if (userTable === 'admin_users') {
      await client.query(
        'UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, userRecord.id]
      );
    } else {
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, userRecord.id]
      );
    }

    // Synchronize password to counterpart table if linked by email
    const effectiveEmail = (userRecord.email || req.user?.email)?.trim()?.toLowerCase();
    if (effectiveEmail) {
      if (userTable === 'admin_users') {
        await client.query(
          'UPDATE users SET password_hash = $1 WHERE LOWER(email) = $2',
          [hashedPassword, effectiveEmail]
        );
      } else {
        await client.query(
          'UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = $2',
          [hashedPassword, effectiveEmail]
        );
      }
    }

    if (req.user?.mobile_number) {
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE mobile_number = $2',
        [hashedPassword, req.user.mobile_number]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error changing password' });
  } finally {
    client.release();
  }
};

// ─── Update Profile (Name & Profile Image) ───────────────────────────────────
exports.updateProfile = async (req, res) => {
  const { name, name_bangla, name_english, profile_image_url } = req.body;
  const effectiveName = name?.trim() || (name_bangla && name_english ? `${name_bangla} (${name_english})` : (name_bangla || name_english));
  if (!effectiveName) return res.status(400).json({ error: 'Name is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let updatedUser = null;
    const adminCheck = await client.query(
      'UPDATE admin_users SET name = $1, name_bangla = $2, name_english = $3, profile_image_url = $4 WHERE id = $5 RETURNING id, name, name_bangla, name_english, email, role, profile_image_url',
      [effectiveName, name_bangla?.trim() || null, name_english?.trim() || null, profile_image_url || null, req.user.id]
    );

    if (adminCheck.rows.length > 0) {
      updatedUser = adminCheck.rows[0];
    }

    if (req.user?.member_id) {
      await client.query(
        'UPDATE members SET full_name = $1, name_bangla = $2, name_english = $3, profile_image_url = COALESCE($4, profile_image_url), updated_at = NOW() WHERE id = $5',
        [effectiveName, name_bangla?.trim() || null, name_english?.trim() || null, profile_image_url || null, req.user.member_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Profile updated successfully', user: updatedUser || { ...req.user, name: effectiveName, profile_image_url } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};
