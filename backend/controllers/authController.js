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

    const result = await client.query(
      'SELECT id, name, name_bangla, name_english, email, password_hash, role, profile_image_url FROM admin_users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

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
      { id: user.id, email: user.email, role: user.role },
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
      `SELECT id FROM admin_users
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

    const result = await client.query(
      'SELECT password_hash FROM admin_users WHERE id = $1',
      [req.user.id]
    );

    const valid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
    if (!valid) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await client.query(
      'UPDATE admin_users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
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

    const result = await client.query(
      'UPDATE admin_users SET name = $1, name_bangla = $2, name_english = $3, profile_image_url = $4 WHERE id = $5 RETURNING id, name, name_bangla, name_english, email, role, profile_image_url',
      [effectiveName, name_bangla?.trim() || null, name_english?.trim() || null, profile_image_url || null, req.user.id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};
