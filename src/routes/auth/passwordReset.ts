import express, { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import database from '../../config/database';
import { addPepper } from '../../utils/crypto';
import { buildPasswordResetEmail } from '../../workers/emailTemplate';

const passwordResetRouter: Router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const SALT_ROUNDS = 12;

// POST /gdt/auth/forgot-password
passwordResetRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const successResponse = {
    message: 'If an account with that email exists, a reset link has been sent.'
  };

  try {
    const userResult = await database.query(
      `SELECT id, username FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (userResult.rows.length === 0) {
      return res.json(successResponse);
    }

    const user = userResult.rows[0];

    await database.query(
      `UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false`,
      [user.id]
    );

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await database.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    if (process.env.RESEND_API_KEY) {
      const resetUrl = `${process.env.FRONTEND_URL ?? 'https://gachadailytracker.com'}/reset-password?token=${token}`;
      await resend.emails.send({
        from: `GachaDailyTracker <${process.env.RESEND_FROM_EMAIL ?? 'noreply@gachadailytracker.com'}>`,
        to: email,
        subject: 'Reset your GachaDailyTracker password',
        html: buildPasswordResetEmail(user.username, resetUrl),
      });
    }

    console.log(`Password reset email sent to user ${user.id}`);
    return res.json(successResponse);

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.json(successResponse);
  }
});

// GET /gdt/auth/reset-password/:token
passwordResetRouter.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const result = await database.query(
      `SELECT id, expires_at, used FROM password_reset_tokens WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Invalid reset link' });
    }

    const row = result.rows[0];

    if (row.used) {
      return res.status(410).json({ valid: false, error: 'This reset link has already been used' });
    }

    if (new Date() > new Date(row.expires_at)) {
      return res.status(410).json({ valid: false, error: 'This reset link has expired' });
    }

    return res.json({ valid: true });

  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ valid: false, error: 'Failed to validate token' });
  }
});

// POST /gdt/auth/reset-password
// Body: { token: string, newPassword: string }
passwordResetRouter.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const result = await database.query(
      `SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid reset link' });
    }

    const row = result.rows[0];

    if (row.used) {
      return res.status(410).json({ error: 'This reset link has already been used' });
    }

    if (new Date() > new Date(row.expires_at)) {
      return res.status(410).json({ error: 'This reset link has expired. Request a new one.' });
    }

    const pepperedPassword = addPepper(newPassword);
    const passwordHash = await bcrypt.hash(pepperedPassword, SALT_ROUNDS);

    const client = await database.getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [passwordHash, row.user_id]
      );
      await client.query(
        `UPDATE password_reset_tokens SET used = true WHERE id = $1`,
        [row.id]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    console.log(`Password reset successful for user ${row.user_id}`);
    return res.json({ message: 'Password reset successful. You can now log in.' });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default passwordResetRouter;
