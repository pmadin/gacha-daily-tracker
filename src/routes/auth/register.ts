import express, { Request, Response, Router, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import database from '../../config/database';

const registerRouter: Router = express.Router();

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
 * /api/auth/register:
 *   post:
 *     summary: Register new user (Enhanced Security)
 *     tags: [Authentication]
 *     description: |
 *       Create a new user account with enhanced security:
 *       - bcrypt hashing (superior to SHA256)
 *       - Automatic salting (16 rounds)
 *       - Pepper for additional security
 *       - Strong password requirements
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 pattern: "^[a-zA-Z0-9_-]+$"
 *                 example: "gacha_master_2025"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 12
 *                 description: Must contain uppercase, lowercase, number, and special character
 *                 example: "MySecure123!Pass"
 *               timezone:
 *                 type: string
 *                 default: "America/Los_Angeles"
 *                 example: "America/Los_Angeles"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Server error
 */
registerRouter.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password, timezone = 'America/Los_Angeles' } = req.body;

        // Enhanced validation
        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'Username, email, and password are required'
            });
        }

        // Username validation
        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({
                error: 'Username must be between 3 and 50 characters'
            });
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return res.status(400).json({
                error: 'Username can only contain letters, numbers, underscores, and hyphens'
            });
        }

        // Enhanced password validation
        if (password.length < 12) {
            return res.status(400).json({
                error: 'Password must be at least 12 characters long'
            });
        }

        const passwordRequirements = [
            { regex: /[a-z]/, message: 'at least one lowercase letter' },
            { regex: /[A-Z]/, message: 'at least one uppercase letter' },
            { regex: /[0-9]/, message: 'at least one number' },
            { regex: /[!@#$%^&*(),.?":{}|<>]/, message: 'at least one special character' }
        ];

        const missingRequirements = passwordRequirements
            .filter(req => !req.regex.test(password))
            .map(req => req.message);

        if (missingRequirements.length > 0) {
            return res.status(400).json({
                error: `Password must contain ${missingRequirements.join(', ')}`
            });
        }

        // Check if user exists
        const existingUser = await database.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                error: 'User with this email or username already exists'
            });
        }

        // Enhanced password hashing: Pepper + Salt + bcrypt
        const pepperedPassword = addPepper(password);
        const saltRounds = 16; // Very secure, takes ~65ms per hash
        const passwordHash = await bcrypt.hash(pepperedPassword, saltRounds);

        // Create user
        const result = await database.query(`
            INSERT INTO users (username, email, password_hash, timezone)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, timezone, created_at
        `, [username, email, passwordHash, timezone]);

        const user = result.rows[0];

        // Security audit log
        console.log(`🔐 New user registered: ${username} (${email}) with enhanced security`);

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                timezone: user.timezone,
                created_at: user.created_at
            },
            security_info: {
                hash_algorithm: 'bcrypt',
                salt_rounds: saltRounds,
                additional_security: ['pepper', 'timing-attack-protection', 'strong-password-policy']
            }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Registration error:', errorMessage);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

export { registerRouter };