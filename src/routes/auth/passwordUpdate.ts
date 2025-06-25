import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import database from '../../config/database';

const passwordRouter: Router = express.Router();

// Pepper: A secret value added to all passwords (stored in environment)
const PEPPER = process.env.PASSWORD_PEPPER || 'fallback-pepper-change-in-production';

/**
 * Enhanced password hashing with salt + pepper
 */
function addPepper(password: string): string {
    // Combine password with pepper using HMAC
    return crypto.createHmac('sha256', PEPPER).update(password).digest('hex');
}

/**
 * @swagger
 * /gdt/auth/update-password:
 *   patch:
 *     summary: Update user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Update user password with enhanced security validation.
 *       Requires:
 *       - Valid JWT token
 *       - Current password verification
 *       - New password confirmation
 *       - Username/email verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, currentPassword, newPassword, confirmNewPassword]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username or email address to verify account identity
 *                 example: "gacha_master_2025"
 *               currentPassword:
 *                 type: string
 *                 description: Current password for verification
 *                 example: "MyCurrentPass123!"
 *               newPassword:
 *                 type: string
 *                 minLength: 15
 *                 description: New password (must meet security requirements)
 *                 example: "MyNewSecure456!"
 *               confirmNewPassword:
 *                 type: string
 *                 description: Confirmation of new password
 *                 example: "MyNewSecure456!"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid credentials
 */
passwordRouter.patch('/update-password', async (req: Request, res: Response) => {
    const client = await database.getClient();
    
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        let decoded: any;
        
        try {
            decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'fallback-secret-change-in-production'
            );
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const { identifier, currentPassword, newPassword, confirmNewPassword } = req.body;

        // Validation
        if (!identifier || !currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({
                error: 'All fields are required: identifier, currentPassword, newPassword, confirmNewPassword'
            });
        }

        // Check new password confirmation
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                error: 'New password and confirmation do not match'
            });
        }

        // Check that new password is different from current
        if (currentPassword === newPassword) {
            return res.status(400).json({
                error: 'New password must be different from current password'
            });
        }

        // Validate new password strength
        if (newPassword.length < 15) {
            return res.status(400).json({
                error: 'New password must be at least 15 characters long'
            });
        }

        const passwordRequirements = [
            { regex: /[a-z]/, message: 'at least one lowercase letter' },
            { regex: /[A-Z]/, message: 'at least one uppercase letter' },
            { regex: /[0-9]/, message: 'at least one number' },
            { regex: /[!@#$%^&*(),.?":{}|<>]/, message: 'at least one special character' }
        ];

        const missingRequirements = passwordRequirements
            .filter(req => !req.regex.test(newPassword))
            .map(req => req.message);

        if (missingRequirements.length > 0) {
            return res.status(400).json({
                error: `New password must contain ${missingRequirements.join(', ')}`
            });
        }

        // Start transaction
        await client.query('BEGIN');

        // Get user and verify identity
        const userResult = await client.query(
            `SELECT id, username, email, password_hash 
             FROM users 
             WHERE id = $1 AND (username = $2 OR email = $2)`,
            [decoded.userId, identifier]
        );

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                error: 'Invalid account identifier or insufficient permissions'
            });
        }

        const user = userResult.rows[0];

        // Verify current password
        const pepperedCurrentPassword = addPepper(currentPassword);
        const validCurrentPassword = await bcrypt.compare(pepperedCurrentPassword, user.password_hash);

        if (!validCurrentPassword) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                error: 'Current password is incorrect'
            });
        }

        // Hash new password
        const pepperedNewPassword = addPepper(newPassword);
        const saltRounds = 16;
        const newPasswordHash = await bcrypt.hash(pepperedNewPassword, saltRounds);

        // Update password
        await client.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newPasswordHash, decoded.userId]
        );

        // Commit transaction
        await client.query('COMMIT');

        // Security audit log
        console.log(`🔐 Password updated for user: ${user.username} (${user.email})`);

        res.json({
            message: 'Password updated successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error: unknown) {
        await client.query('ROLLBACK');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Password update error:', errorMessage);
        res.status(500).json({ error: 'Failed to update password' });
    } finally {
        client.release();
    }
});

export { passwordRouter };