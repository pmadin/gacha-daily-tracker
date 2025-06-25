import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import validator from 'validator';
import database from '../../config/database';

const emailRouter: Router = express.Router();

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
 * /gdt/auth/update-email:
 *   patch:
 *     summary: Update user email address
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Update user email address with password verification.
 *       Requires:
 *       - Valid JWT token
 *       - Password verification for security
 *       - Valid email format
 *       - Email must not already be in use
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newEmail, password]
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 description: New email address
 *                 example: "newemail@example.com"
 *               password:
 *                 type: string
 *                 description: Current password for verification
 *                 example: "MyCurrentPass123!"
 *     responses:
 *       200:
 *         description: Email updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email updated successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid password
 *       409:
 *         description: Email already in use
 */
emailRouter.patch('/update-email', async (req: Request, res: Response) => {
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

        const { newEmail, password } = req.body;

        // Validation
        if (!newEmail || !password) {
            return res.status(400).json({
                error: 'New email and password are required'
            });
        }

        // Validate email format
        if (!validator.isEmail(newEmail)) {
            return res.status(400).json({
                error: 'Please enter a valid email address'
            });
        }

        // Start transaction
        await client.query('BEGIN');

        // Get current user
        const userResult = await client.query(
            'SELECT id, username, email, password_hash FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Check if new email is same as current
        if (user.email.toLowerCase() === newEmail.toLowerCase()) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'New email must be different from current email'
            });
        }

        // Verify password
        const pepperedPassword = addPepper(password);
        const validPassword = await bcrypt.compare(pepperedPassword, user.password_hash);

        if (!validPassword) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                error: 'Invalid password'
            });
        }

        // Check if new email is already in use
        const existingEmailResult = await client.query(
            'SELECT id FROM users WHERE email = $1 AND id != $2',
            [newEmail, decoded.userId]
        );

        if (existingEmailResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'Email address is already in use'
            });
        }

        // Update email
        const updateResult = await client.query(
            `UPDATE users 
             SET email = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING id, username, email, updated_at`,
            [newEmail, decoded.userId]
        );

        // Commit transaction
        await client.query('COMMIT');

        const updatedUser = updateResult.rows[0];

        // Security audit log
        console.log(`📧 Email updated for user: ${user.username} (${user.email} -> ${newEmail})`);

        res.json({
            message: 'Email updated successfully',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                updated_at: updatedUser.updated_at
            }
        });

    } catch (error: unknown) {
        await client.query('ROLLBACK');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Email update error:', errorMessage);
        res.status(500).json({ error: 'Failed to update email' });
    } finally {
        client.release();
    }
});

export { emailRouter };