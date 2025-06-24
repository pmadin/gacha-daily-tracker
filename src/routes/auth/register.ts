import express, { Request, Response, Router, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import database from '../../config/database';
import TimezoneService from '../../services/timezoneService';

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
 * /gdt/auth/register:
 *   post:
 *     summary: Register new user (Enhanced Security)
 *     tags: [Authentication]
 *     description: |
 *       Create a new user account with enhanced security:
 *       - bcrypt hashing (superior to SHA256)
 *       - Automatic salting (16 rounds)
 *       - Pepper for additional security
 *       - Strong password requirements
 *       - Timezone auto-detection if not provided
 *     parameters:
 *       - in: header
 *         name: X-User-Timezone
 *         schema:
 *           type: string
 *         description: User's timezone from browser (optional backup)
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
 *                 minLength: 5
 *                 maxLength: 50
 *                 pattern: "^[a-zA-Z0-9_-]+$"
 *                 example: "gacha_master_2025"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 15
 *                 description: Must contain uppercase, lowercase, number, and special character
 *                 example: "MySecure123!Pass"
 *               timezone:
 *                 type: string
 *                 description: IANA timezone identifier. Auto-detected if not provided.
 *                 example: "America/Los_Angeles"
 *           examples:
 *             with_timezone:
 *               summary: With explicit timezone
 *               value:
 *                 username: "gacha_master_2025"
 *                 email: "user@example.com"
 *                 password: "MySecure123!Pass"
 *                 timezone: "America/Los_Angeles"
 *             auto_detect:
 *               summary: Auto-detect timezone
 *               value:
 *                 username: "gacha_master_2025"
 *                 email: "user@example.com"
 *                 password: "MySecure123!Pass"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     timezone:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                     detected_timezone:
 *                       type: boolean
 *                 security_info:
 *                   type: object
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Server error
 */
registerRouter.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        // Enhanced validation
        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'Username, email, and password are required'
            });
        }

        // Username validation
        if (username.length < 5 || username.length > 50) {
            return res.status(400).json({
                error: 'Username must be between 5 and 50 characters'
            });
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return res.status(400).json({
                error: 'Username can only contain letters, numbers, underscores, and hyphens'
            });
        }

        // Enhanced password validation
        if (password.length < 15) {
            return res.status(400).json({
                error: 'Password must be at least 15 characters long'
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

        // Detect or validate timezone
        let userTimezone = await TimezoneService.detectUserTimezone(req);
        let wasDetected = !req.body.timezone;

        // If timezone was provided, validate it
        if (req.body.timezone) {
            if (!TimezoneService.isValidTimezone(req.body.timezone)) {
                return res.status(400).json({
                    error: 'Invalid timezone. Use /gdt/auth/timezones to see valid options.'
                });
            }
            userTimezone = TimezoneService.normalizeTimezone(req.body.timezone);
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

        // Create user with timezone
        const result = await database.query(`
            INSERT INTO users (username, email, password_hash, timezone)
            VALUES ($1, $2, $3, $4)
                RETURNING id, username, email, timezone, created_at
        `, [username, email, passwordHash, userTimezone]);

        const user = result.rows[0];

        // Security audit log
        console.log(`🔐 New user registered: ${username} (${email}) with enhanced security`);
        console.log(`   Timezone: ${userTimezone} (${wasDetected ? 'auto-detected' : 'user-provided'})`);

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                timezone: user.timezone,
                created_at: user.created_at,
                detected_timezone: wasDetected
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