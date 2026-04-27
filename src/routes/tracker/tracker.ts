import express, { Router } from 'express';
import database from '../../config/database';
import { authenticateToken } from '../../middleware/auth';

const trackerRouter: Router = express.Router();

trackerRouter.use(authenticateToken);

/**
 * @swagger
 * /gdt/tracker/games:
 *   get:
 *     summary: Get user's tracked games
 *     tags: [Tracker]
 *     security:
 *       - bearerAuth: []
 *     description: Returns the authenticated user's personal game list with today's completion status and all fields needed for countdown timers.
 *     responses:
 *       200:
 *         description: List of tracked games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 games:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_game_id:
 *                         type: integer
 *                       game_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       server:
 *                         type: string
 *                       timezone:
 *                         type: string
 *                       daily_reset:
 *                         type: string
 *                       icon_name:
 *                         type: string
 *                       is_enabled:
 *                         type: boolean
 *                       completed_today:
 *                         type: boolean
 *                       added_at:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *       401:
 *         description: Authentication required
 */
trackerRouter.get('/games', async (req, res) => {
    try {
        const { userId } = req.user!;

        const result = await database.query(`
            SELECT
                ug.id          AS user_game_id,
                ug.is_enabled,
                ug.created_at  AS added_at,
                g.id           AS game_id,
                g.name,
                g.server,
                g.timezone,
                g.daily_reset,
                g.icon_name,
                CASE WHEN dc.id IS NOT NULL THEN true ELSE false END AS completed_today
            FROM user_games ug
            JOIN games g ON g.id = ug.game_id AND g.is_active = true
            LEFT JOIN daily_completions dc
                ON dc.user_id = ug.user_id
                AND dc.game_id = ug.game_id
                AND dc.completion_date = CURRENT_DATE
            WHERE ug.user_id = $1
            ORDER BY g.name
        `, [userId]);

        res.json({
            games: result.rows,
            total: result.rows.length
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching tracked games:', errorMessage);
        res.status(500).json({ error: 'Failed to fetch tracked games' });
    }
});

/**
 * @swagger
 * /gdt/tracker/games/bulk:
 *   post:
 *     summary: Bulk add games to user's list
 *     tags: [Tracker]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Add multiple games at once. Used when an anonymous user signs up and wants to sync
 *       their locally-saved game selections to the database. Skips games already tracked
 *       and invalid/inactive game IDs without failing the whole request.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [gameIds]
 *             properties:
 *               gameIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 maxItems: 500
 *                 example: [1, 4, 17, 42]
 *     responses:
 *       200:
 *         description: Bulk import result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 added:
 *                   type: integer
 *                 already_tracked:
 *                   type: integer
 *                 invalid_ids:
 *                   type: array
 *                   items:
 *                     type: integer
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Authentication required
 */
trackerRouter.post('/games/bulk', async (req, res) => {
    try {
        const { userId } = req.user!;
        const { gameIds } = req.body;

        if (!Array.isArray(gameIds) || gameIds.length === 0) {
            return res.status(400).json({ error: 'gameIds must be a non-empty array' });
        }

        if (gameIds.length > 500) {
            return res.status(400).json({ error: 'Cannot bulk-add more than 500 games at once' });
        }

        // Validate all values are positive integers
        const validIds = gameIds.filter(id => Number.isInteger(id) && id > 0);
        const invalidIds = gameIds.filter(id => !Number.isInteger(id) || id <= 0);

        if (validIds.length === 0) {
            return res.status(400).json({ error: 'No valid game IDs provided' });
        }

        // Filter to only active games that actually exist
        const activeGamesResult = await database.query(
            `SELECT id FROM games WHERE id = ANY($1) AND is_active = true`,
            [validIds]
        );
        const activeIds = activeGamesResult.rows.map(r => r.id);
        const notFoundIds = validIds.filter(id => !activeIds.includes(id));
        const allInvalidIds = [...invalidIds, ...notFoundIds];

        if (activeIds.length === 0) {
            return res.status(200).json({ added: 0, already_tracked: 0, invalid_ids: allInvalidIds });
        }

        // Bulk insert, skip conflicts
        const placeholders = activeIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        const values = [userId, ...activeIds];

        const insertResult = await database.query(
            `INSERT INTO user_games (user_id, game_id)
             VALUES ${placeholders}
             ON CONFLICT (user_id, game_id) DO NOTHING`,
            values
        );

        const added = insertResult.rowCount ?? 0;
        const alreadyTracked = activeIds.length - added;

        res.json({
            added,
            already_tracked: alreadyTracked,
            invalid_ids: allInvalidIds
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error bulk adding games:', errorMessage);
        res.status(500).json({ error: 'Failed to bulk add games' });
    }
});

/**
 * @swagger
 * /gdt/tracker/games/{gameId}:
 *   post:
 *     summary: Add a game to user's list
 *     tags: [Tracker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Game added to tracking list
 *       404:
 *         description: Game not found or inactive
 *       409:
 *         description: Already tracking this game
 *       401:
 *         description: Authentication required
 */
trackerRouter.post('/games/:gameId', async (req, res) => {
    try {
        const { userId } = req.user!;
        const gameId = parseInt(req.params.gameId);

        if (isNaN(gameId)) {
            return res.status(400).json({ error: 'Invalid game ID' });
        }

        // Verify game exists and is active
        const gameCheck = await database.query(
            'SELECT id, name, server FROM games WHERE id = $1 AND is_active = true',
            [gameId]
        );

        if (gameCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Game not found or inactive' });
        }

        const result = await database.query(
            `INSERT INTO user_games (user_id, game_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, game_id) DO NOTHING
             RETURNING *`,
            [userId, gameId]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({ error: 'Already tracking this game' });
        }

        const game = gameCheck.rows[0];
        res.status(201).json({
            message: 'Game added to your list',
            user_game: result.rows[0],
            game: { id: game.id, name: game.name, server: game.server }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error adding game to tracker:', errorMessage);
        res.status(500).json({ error: 'Failed to add game' });
    }
});

/**
 * @swagger
 * /gdt/tracker/games/{gameId}:
 *   delete:
 *     summary: Remove a game from user's list
 *     tags: [Tracker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Game removed from tracking list
 *       404:
 *         description: Not tracking this game
 *       401:
 *         description: Authentication required
 */
trackerRouter.delete('/games/:gameId', async (req, res) => {
    try {
        const { userId } = req.user!;
        const gameId = parseInt(req.params.gameId);

        if (isNaN(gameId)) {
            return res.status(400).json({ error: 'Invalid game ID' });
        }

        const result = await database.query(
            'DELETE FROM user_games WHERE user_id = $1 AND game_id = $2 RETURNING *',
            [userId, gameId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not tracking this game' });
        }

        res.json({ message: 'Game removed from your list' });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error removing game from tracker:', errorMessage);
        res.status(500).json({ error: 'Failed to remove game' });
    }
});

/**
 * @swagger
 * /gdt/tracker/games/{gameId}/complete:
 *   post:
 *     summary: Mark today's daily as complete
 *     tags: [Tracker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Daily marked as complete (idempotent)
 *       404:
 *         description: Not tracking this game
 *       401:
 *         description: Authentication required
 */
trackerRouter.post('/games/:gameId/complete', async (req, res) => {
    try {
        const { userId } = req.user!;
        const gameId = parseInt(req.params.gameId);

        if (isNaN(gameId)) {
            return res.status(400).json({ error: 'Invalid game ID' });
        }

        // Verify user is tracking this game
        const trackCheck = await database.query(
            'SELECT id FROM user_games WHERE user_id = $1 AND game_id = $2',
            [userId, gameId]
        );

        if (trackCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Not tracking this game' });
        }

        await database.query(
            `INSERT INTO daily_completions (user_id, game_id, completion_date)
             VALUES ($1, $2, CURRENT_DATE)
             ON CONFLICT (user_id, game_id, completion_date) DO NOTHING`,
            [userId, gameId]
        );

        res.json({ message: 'Daily marked as complete', date: new Date().toISOString().split('T')[0] });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error marking daily complete:', errorMessage);
        res.status(500).json({ error: 'Failed to mark daily complete' });
    }
});

/**
 * @swagger
 * /gdt/tracker/games/{gameId}/complete:
 *   delete:
 *     summary: Unmark today's daily
 *     tags: [Tracker]
 *     security:
 *       - bearerAuth: []
 *     description: Removes today's completion record. Idempotent — safe to call even if not marked complete.
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Daily unmarked (idempotent)
 *       401:
 *         description: Authentication required
 */
trackerRouter.delete('/games/:gameId/complete', async (req, res) => {
    try {
        const { userId } = req.user!;
        const gameId = parseInt(req.params.gameId);

        if (isNaN(gameId)) {
            return res.status(400).json({ error: 'Invalid game ID' });
        }

        await database.query(
            `DELETE FROM daily_completions
             WHERE user_id = $1 AND game_id = $2 AND completion_date = CURRENT_DATE`,
            [userId, gameId]
        );

        res.json({ message: 'Daily unmarked', date: new Date().toISOString().split('T')[0] });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error unmarking daily:', errorMessage);
        res.status(500).json({ error: 'Failed to unmark daily' });
    }
});

export { trackerRouter };
