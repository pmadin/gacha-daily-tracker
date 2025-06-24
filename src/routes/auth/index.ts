import express, { Router, Request, Response } from 'express';
import { registerRouter } from './register';
import { loginRouter } from './login';
import { deleteRouter } from './delete';
import TimezoneService from '../../services/timezoneService';
import jwt from 'jsonwebtoken';
import database from '../../config/database';

const authRoutes: Router = express.Router();

// Combine auth subroutes
authRoutes.use(registerRouter);
authRoutes.use(loginRouter);
authRoutes.use(deleteRouter);

/**
 * @swagger
 * /gdt/auth/timezones:
 *   get:
 *     summary: Get supported timezones
 *     tags: [Authentication]
 *     description: Get a list of all supported timezones grouped by region
 *     responses:
 *       200:
 *         description: Timezones retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timezones:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         timezone:
 *                           type: string
 *                           example: "America/Los_Angeles"
 *                         offset:
 *                           type: string
 *                           example: "UTC-8"
 *                         label:
 *                           type: string
 *                           example: "Pacific Time (US)"
 */
authRoutes.get('/timezones', (req: Request, res: Response) => {
    const timezones = TimezoneService.getAllTimezones();
    res.json({ timezones });
});

/**
 * @swagger
 * /gdt/auth/detect-timezone:
 *   get:
 *     summary: Auto-detect user timezone
 *     tags: [Authentication]
 *     description: Attempt to detect user's timezone from request headers or IP
 *     parameters:
 *       - in: header
 *         name: X-User-Timezone
 *         schema:
 *           type: string
 *         description: User's timezone from browser (Intl.DateTimeFormat().resolvedOptions().timeZone)
 *     responses:
 *       200:
 *         description: Timezone detected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 detected_timezone:
 *                   type: string
 *                   example: "America/Los_Angeles"
 *                 current_time:
 *                   type: string
 *                   example: "14:30"
 */
authRoutes.get('/detect-timezone', async (req: Request, res: Response) => {
    try {
        const detectedTimezone = await TimezoneService.detectUserTimezone(req);
        const currentTime = TimezoneService.getCurrentTimeInTimezone(detectedTimezone);

        res.json({
            detected_timezone: detectedTimezone,
            current_time: currentTime
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to detect timezone' });
    }
});

/**
 * @swagger
 * /gdt/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Update user profile including timezone
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timezone:
 *                 type: string
 *                 example: "Asia/Tokyo"
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 */
authRoutes.put('/profile', async (req: Request, res: Response) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'fallback-secret-change-in-production'
        ) as any;

        const { timezone, email } = req.body;
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        // Handle timezone update
        if (timezone) {
            if (!TimezoneService.isValidTimezone(timezone)) {
                return res.status(400).json({
                    error: 'Invalid timezone. Use /gdt/auth/timezones to see valid options.'
                });
            }
            updates.push(`timezone = $${paramIndex}`);
            values.push(TimezoneService.normalizeTimezone(timezone));
            paramIndex++;
        }

        // Handle email update
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            // Check if email already exists
            const existingEmail = await database.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, decoded.userId]
            );

            if (existingEmail.rows.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }

            updates.push(`email = $${paramIndex}`);
            values.push(email);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        // Add updated_at
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        // Add user id for WHERE clause
        values.push(decoded.userId);

        const query = `
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, username, email, timezone
        `;

        const result = await database.query(query, values);

        res.json({
            message: 'Profile updated successfully',
            user: result.rows[0]
        });

    } catch (error: unknown) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Profile update error:', errorMessage);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export { authRoutes };