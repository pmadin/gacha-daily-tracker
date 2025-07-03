import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import database from '../../config/database';

const loginRouter: Router = express.Router();

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
 * /gdt/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     description: |
 *       Authenticate user with enhanced security measures:
 *       - Timing-attack protection
 *       - Pepper verification
 *       - Secure JWT generation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "MySecure123!Pass"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 *                 expires_in:
 *                   type: string
 *                   example: "30 days"
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
loginRouter.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = await database.query(
            'SELECT id, username, email, password_hash, timezone, role FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            // Timing attack protection: still hash even if user doesn't exist
            await bcrypt.hash('dummy-password-to-prevent-timing-attacks', 16);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Enhanced password verification: Apply pepper then verify
        const pepperedPassword = addPepper(password);
        const validPassword = await bcrypt.compare(pepperedPassword, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate secure JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                iat: Math.floor(Date.now() / 1000) // Issued at time
            },
            process.env.JWT_SECRET || 'fallback-secret-change-in-production',
            {
                expiresIn: '30d',
                issuer: 'gacha-daily-tracker',
                audience: 'gacha-users'
            }
        );

        // Security audit log
        console.log(`🔓 User logged in: ${user.username} (${user.email})`);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                timezone: user.timezone
            },
            expires_in: '30 days'
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Login error:', errorMessage);
        res.status(500).json({ error: 'Login failed' });
    }
});

export { loginRouter };