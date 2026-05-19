import express, { Router, Request, Response } from 'express';
import database from '../../config/database';
import { requireAdmin } from '../../middleware/admin';

const adminSettingsRouter: Router = express.Router();

/**
 * @swagger
 * /gdt/admin/settings:
 *   get:
 *     summary: Get all site settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: Returns all current site-wide settings as a key-value map. Requires admin role (3+).
 *     responses:
 *       200:
 *         description: All site settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                   example:
 *                     leaderboard_enabled: "false"
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 */
adminSettingsRouter.get('/settings', requireAdmin, async (_req: Request, res: Response) => {
    try {
        const result = await database.query(
            `SELECT key, value, updated_at FROM site_settings ORDER BY key`
        );
        const settings = Object.fromEntries(result.rows.map(r => [r.key, r.value]));
        res.json({ settings });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: msg });
    }
});

/**
 * @swagger
 * /gdt/admin/settings/leaderboard:
 *   patch:
 *     summary: Toggle leaderboard visibility
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: Enable or disable the public leaderboard page. Requires admin role (3+).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enabled]
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Leaderboard enabled"
 *                 leaderboard_enabled:
 *                   type: boolean
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 */
adminSettingsRouter.patch('/settings/leaderboard', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'enabled must be a boolean' });
        }

        await database.query(
            `INSERT INTO site_settings (key, value, updated_by, updated_at)
             VALUES ('leaderboard_enabled', $1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (key) DO UPDATE SET
               value      = EXCLUDED.value,
               updated_by = EXCLUDED.updated_by,
               updated_at = CURRENT_TIMESTAMP`,
            [String(enabled), req.user!.userId]
        );

        res.json({
            message: `Leaderboard ${enabled ? 'enabled' : 'disabled'}`,
            leaderboard_enabled: enabled,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: msg });
    }
});

export default adminSettingsRouter;
