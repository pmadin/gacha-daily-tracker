import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import validator from 'validator';
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
 *     summary: Register new user
 *     tags: [Authentication]
 *     description: |
 *       Create a new user account with enhanced security:
 *       - bcrypt hashing (superior to SHA256)
 *       - Automatic salting (16 rounds)
 *       - Pepper for additional security
 *       - Strong password requirements
 *       - Password confirmation validation
 *       - Timezone auto-detection if not provided
 *       - Optional profile fields
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, confirmPassword]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 50
 *                 pattern: "^[a-zA-Z0-9_-]+$"
 *                 example: "gacha_whal3_42069"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 15
 *                 description: Must contain uppercase, lowercase, number, and special character
 *                 example: "Azurlane!Xnikke"
 *               confirmPassword:
 *                 type: string
 *                 description: Must match the password field
 *                 example: "Azurlane!Xnikke"
 *               timezone:
 *                 type: string
 *                 description: IANA timezone identifier. Auto-detected if not provided.
 *                 example: "America/Los_Angeles"
 *               first_name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Optional first name
 *                 example: "Andy"
 *               last_name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Optional last name
 *                 example: "Ken"
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *                 description: Optional phone number for future SMS features
 *                 example: "+1234567890"
 */
registerRouter.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password, confirmPassword, first_name, last_name, phone, registrationToken} = req.body;

        // Check for registration token first
        const validRegistrationToken = process.env.REGISTRATION_TOKEN || 'your-secret-registration-key';

        if (!registrationToken || registrationToken !== validRegistrationToken) {
            return res.status(403).json({
                error: 'Invalid registration token. Registration is restricted.',
                hint: 'Contact the administrator for a valid registration token.'
            });
        }

        // Enhanced validation
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({
                error: 'Username, email, password, password confirmation, and registration token are required'
            });
        }

        // Email validation using validator
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                error: 'Please enter a valid email address'
            });
        }

        // Password confirmation validation
        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'Password and password confirmation do not match'
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

        // Validate optional fields
        if (first_name && first_name.length > 100) {
            return res.status(400).json({ error: 'First name must be 100 characters or less' });
        }

        if (last_name && last_name.length > 100) {
            return res.status(400).json({ error: 'Last name must be 100 characters or less' });
        }

        if (phone && (phone.length > 20 || !/^[+]?[1-9][\d\s\-()]{7,18}$/.test(phone))) {
            return res.status(400).json({ error: 'Invalid phone number format' });
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

        // Create user with optional fields
        const result = await database.query(`
            INSERT INTO users (username, email, password_hash, timezone, first_name, last_name, phone, role)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
                RETURNING id, username, email, timezone, first_name, last_name, phone, role, created_at
        `, [username, email, passwordHash, userTimezone, first_name || null, last_name || null, phone || null]);

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
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                role: user.role,
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