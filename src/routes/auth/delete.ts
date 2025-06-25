import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import database from '../../config/database';

const deleteRouter: Router = express.Router();

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
 * /auth/account:
 *   delete:
 *     summary: Delete user account
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Permanently delete user account and all associated data.
 *       This action is irreversible and will delete:
 *       - User profile information
 *       - All saved games (user_games)
 *       - All daily completion records
 *       - All reminder settings
 *
 *       Requires JWT token, password confirmation, and username/email verification for security.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, identifier]
 *             properties:
 *               password:
 *                 type: string
 *                 description: User's current password for confirmation
 *                 example: "MySecure123!Pass"
 *               identifier:
 *                 type: string
 *                 description: Username or email address to verify account identity
 *                 example: "gacha_master_2025"
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User account deleted successfully"
 *                 details:
 *                   type: object
 *                   properties:
 *                     account:
 *                       type: object
 *                       properties:
 *                         account_id:
 *                           type: number
 *                           example: 123
 *                         firstname:
 *                           type: string
 *                           example: "John"
 *                         lastname:
 *                           type: string
 *                           example: "Doe"
 *                         username:
 *                           type: string
 *                           example: "gacha_master_2025"
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
 *                         phone:
 *                           type: string
 *                           example: "+1234567890"
 *                         role:
 *                           type: number
 *                           example: 1
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Password and username/email are required for account deletion"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or expired token"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid password or account identifier"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete account"
 */
deleteRouter.delete('/account', async (req: Request, res: Response) => {
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

        // Get password and identifier from request body
        const { password, identifier } = req.body;

        if (!password || !identifier) {
            return res.status(400).json({
                error: 'Password and username/email are required for account deletion'
            });
        }

        // Start transaction
        await client.query('BEGIN');

        // Get user details before deletion - verify both JWT user ID and provided identifier match
        const userResult = await client.query(
            `SELECT id, username, email, password_hash, timezone, created_at,
                    COALESCE(first_name, '') as firstname,
                    COALESCE(last_name, '') as lastname,
                    COALESCE(phone, '') as phone,
                    COALESCE(role, 1) as role
             FROM users
             WHERE id = $1 AND (username = $2 OR email = $2)`,
            [decoded.userId, identifier]
        );

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                error: 'Invalid password or account identifier'
            });
        }

        const user = userResult.rows[0];

        // Verify password with pepper
        const pepperedPassword = addPepper(password);
        const validPassword = await bcrypt.compare(pepperedPassword, user.password_hash);

        if (!validPassword) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                error: 'Invalid password or account identifier'
            });
        }

        // Get deletion statistics (optional - for audit purposes)
        const statsResult = await client.query(`
            SELECT
                    (SELECT COUNT(*) FROM user_games WHERE user_id = $1) as games_count,
                    (SELECT COUNT(*) FROM daily_completions WHERE user_id = $1) as completions_count,
                    (SELECT COUNT(*) FROM reminder_settings WHERE user_id = $1) as reminders_count
        `, [decoded.userId]);

        const stats = statsResult.rows[0];

        // Delete the user (CASCADE will handle related tables)
        await client.query('DELETE FROM users WHERE id = $1', [decoded.userId]);

        // Commit transaction
        await client.query('COMMIT');

        // Log the deletion for audit purposes
        console.log(`🗑️  User account deleted: ${user.username} (${user.email})`);
        console.log(`   Cascade deleted: ${stats.games_count} games, ${stats.completions_count} completions, ${stats.reminders_count} reminders`);

        // Return success with user details
        res.json({
            message: 'User account deleted successfully',
            details: {
                account: {
                    account_id: user.id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                }
            }
        });

    } catch (error: unknown) {
        await client.query('ROLLBACK');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Account deletion error:', errorMessage);
        res.status(500).json({ error: 'Failed to delete account' });
    } finally {
        client.release();
    }
});

export { deleteRouter };