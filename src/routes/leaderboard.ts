import express, { Router, Request, Response } from 'express';
import database from '../config/database';
import { authenticateToken } from '../middleware/auth';

const leaderboardRouter: Router = express.Router();

/**
 * @swagger
 * /gdt/leaderboard/status:
 *   get:
 *     summary: Get leaderboard visibility status
 *     tags: [Leaderboard]
 *     description: Returns whether the public leaderboard is currently enabled.
 *     responses:
 *       200:
 *         description: Leaderboard visibility status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                   example: true
 */
leaderboardRouter.get('/status', async (_req: Request, res: Response) => {
    try {
        const result = await database.query(
            `SELECT value FROM site_settings WHERE key = 'leaderboard_enabled'`
        );
        res.json({ enabled: result.rows[0]?.value === 'true' });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: msg });
    }
});

/**
 * @swagger
 * /gdt/leaderboard/visibility:
 *   get:
 *     summary: Get own leaderboard participation status
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     description: Returns whether the authenticated user is currently hidden from the leaderboard.
 *     responses:
 *       200:
 *         description: User's leaderboard participation status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hidden:
 *                   type: boolean
 *                   example: false
 *       401:
 *         $ref: '#/components/schemas/Error'
 */
leaderboardRouter.get('/visibility', authenticateToken, async (req: Request, res: Response) => {
    try {
        const result = await database.query(
            `SELECT leaderboard_hidden FROM users WHERE id = $1`,
            [req.user!.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ hidden: result.rows[0].leaderboard_hidden });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: msg });
    }
});

/**
 * @swagger
 * /gdt/leaderboard/visibility:
 *   patch:
 *     summary: Update own leaderboard participation
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Opt in or out of the public leaderboard. Admins and owners are
 *       encouraged to hide themselves to keep the leaderboard trustworthy.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hidden]
 *             properties:
 *               hidden:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Participation status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 hidden:
 *                   type: boolean
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 */
leaderboardRouter.patch('/visibility', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { hidden } = req.body;
        if (typeof hidden !== 'boolean') {
            return res.status(400).json({ error: 'hidden must be a boolean' });
        }

        await database.query(
            `UPDATE users SET leaderboard_hidden = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [hidden, req.user!.userId]
        );

        res.json({
            message: hidden ? 'You are now hidden from the leaderboard' : 'You are now visible on the leaderboard',
            hidden,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: msg });
    }
});

/**
 * @swagger
 * /gdt/leaderboard:
 *   get:
 *     summary: Get leaderboard
 *     tags: [Leaderboard]
 *     description: >
 *       Returns top users ranked by current streak count. When the leaderboard
 *       is disabled, returns `enabled: false` with an empty list rather than an error.
 *       Only users with at least one tracked game, streak_count > 0, and
 *       leaderboard_hidden = false appear.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of results per page (max 100)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Leaderboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: integer
 *                         example: 1
 *                       username:
 *                         type: string
 *                         example: "hunter_x"
 *                       streak:
 *                         type: integer
 *                         example: 42
 *                       games_tracked:
 *                         type: integer
 *                         example: 5
 *                       last_active:
 *                         type: string
 *                         format: date
 *                 total:
 *                   type: integer
 *                   example: 87
 */
leaderboardRouter.get('/', async (req: Request, res: Response) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '50')), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0')), 0);

        const settingResult = await database.query(
            `SELECT value FROM site_settings WHERE key = 'leaderboard_enabled'`
        );
        const enabled = settingResult.rows[0]?.value === 'true';

        if (!enabled) {
            return res.json({ enabled: false, leaderboard: [], total: 0 });
        }

        const [dataResult, countResult] = await Promise.all([
            database.query(
                `SELECT
                    u.username,
                    u.streak_count,
                    u.streak_last_date,
                    COUNT(ug.game_id) AS games_tracked
                 FROM users u
                 INNER JOIN user_games ug ON ug.user_id = u.id
                 WHERE u.streak_count > 0
                   AND u.leaderboard_hidden = FALSE
                 GROUP BY u.id, u.username, u.streak_count, u.streak_last_date
                 HAVING COUNT(ug.game_id) >= 1
                 ORDER BY u.streak_count DESC, u.streak_last_date DESC
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            ),
            database.query(
                `SELECT COUNT(DISTINCT u.id) AS total
                 FROM users u
                 INNER JOIN user_games ug ON ug.user_id = u.id
                 WHERE u.streak_count > 0
                   AND u.leaderboard_hidden = FALSE`
            ),
        ]);

        res.json({
            enabled: true,
            leaderboard: dataResult.rows.map((row, index) => ({
                rank: offset + index + 1,
                username: row.username,
                streak: Number(row.streak_count),
                games_tracked: Number(row.games_tracked),
                last_active: row.streak_last_date,
            })),
            total: Number(countResult.rows[0].total),
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: msg });
    }
});

export default leaderboardRouter;
