import express, { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import database from '../../config/database';
import TimezoneService from '../../services/timezoneService';

const profileRoutes: Router = express.Router();

/**
 * @swagger
 * /gdt/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Update user profile including timezone and basic info (non-sensitive updates)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timezone:
 *                 type: string
 *                 example: "Asia/Tokyo"
 *               first_name:
 *                 type: string
 *                 example: "Noah"
 *               last_name:
 *                 type: string
 *                 example: "Nick"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 */
profileRoutes.put('/profile', async (req: Request, res: Response) => {
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

        const { timezone, first_name, last_name, phone } = req.body;
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        // Handle timezone update
        if (timezone) {
            if (!TimezoneService.isValidTimezone(timezone)) {
                return res.status(400).json({
                    error: 'Invalid timezone. Use /gdt/timezones/list to see valid options.'
                });
            }
            updates.push(`timezone = $${paramIndex}`);
            values.push(TimezoneService.normalizeTimezone(timezone));
            paramIndex++;
        }

        // Handle optional profile fields
        if (first_name !== undefined) {
            if (first_name && first_name.length > 100) {
                return res.status(400).json({ error: 'First name must be 100 characters or less' });
            }
            updates.push(`first_name = $${paramIndex}`);
            values.push(first_name || null);
            paramIndex++;
        }

        if (last_name !== undefined) {
            if (last_name && last_name.length > 100) {
                return res.status(400).json({ error: 'Last name must be 100 characters or less' });
            }
            updates.push(`last_name = $${paramIndex}`);
            values.push(last_name || null);
            paramIndex++;
        }

        if (phone !== undefined) {
            if (phone && (phone.length > 20 || !/^[\+]?[1-9][\d\s\-\(\)]{7,18}$/.test(phone))) {
                return res.status(400).json({ error: 'Invalid phone number format' });
            }
            updates.push(`phone = $${paramIndex}`);
            values.push(phone || null);
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
            RETURNING id, username, email, timezone, first_name, last_name, phone, role
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

export { profileRoutes };