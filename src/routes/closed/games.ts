import express from 'express';
import database from '../../config/database';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

// Apply authentication to all routes in this file
router.use(authenticateToken);

/**
 * @swagger
 * /gdt/closed/games/{id}:
 *   patch:
 *     summary: Update game information
 *     tags: [Game Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Update game information like reset times, timezone, etc.
 *       Requires authentication. Useful when game publishers change reset times
 *       (like when Azur Lane EN changed from 23:00 to 00:00).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game ID to update
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daily_reset:
 *                 type: string
 *                 pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                 description: New daily reset time (HH:MM format)
 *                 example: "01:00"
 *               timezone:
 *                 type: string
 *                 description: New timezone
 *                 example: "America/Los_Angeles"
 *               reason:
 *                 type: string
 *                 description: Reason for the change (for audit purposes)
 *                 example: "Official game announcement - reset time changed"
 *           examples:
 *             azur_lane_change:
 *               summary: Azur Lane EN reset time change
 *               value:
 *                 daily_reset: "01:00"
 *                 reason: "Azur Lane EN changed daily reset from 00:00 to 01:00 PST"
 *             timezone_update:
 *               summary: Timezone correction
 *               value:
 *                 timezone: "America/New_York"
 *                 reason: "Corrected timezone for NA server"
 *     responses:
 *       200:
 *         description: Game updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Game updated successfully"
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *                 updated_by:
 *                   type: string
 *                   example: "username"
 *                 update_reason:
 *                   type: string
 *                   example: "Official game announcement"
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { daily_reset, timezone, reason } = req.body;
        const user = req.user!; // TypeScript knows user exists due to middleware

        // Validate that at least one field is being updated
        if (!daily_reset && !timezone) {
            return res.status(400).json({
                error: 'At least one field (daily_reset or timezone) must be provided'
            });
        }

        // Validate daily_reset format if provided
        if (daily_reset) {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(daily_reset)) {
                return res.status(400).json({
                    error: 'daily_reset must be in HH:MM format (24-hour)'
                });
            }
        }

        // Check if game exists
        const gameCheck = await database.query(
            'SELECT * FROM games WHERE id = $1 AND is_active = true',
            [id]
        );

        if (gameCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const originalGame = gameCheck.rows[0];

        // Build dynamic update query
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

        if (daily_reset) {
            updateFields.push(`daily_reset = $${paramIndex}`);
            updateValues.push(daily_reset);
            paramIndex++;
        }

        if (timezone) {
            updateFields.push(`timezone = $${paramIndex}`);
            updateValues.push(timezone);
            paramIndex++;
        }

        // Always update last_verified
        updateFields.push(`last_verified = CURRENT_TIMESTAMP`);

        // Add WHERE clause parameter
        updateValues.push(id);

        const updateQuery = `
      UPDATE games 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await database.query(updateQuery, updateValues);
        const updatedGame = result.rows[0];

        // Log the change for audit purposes
        console.log(`🔄 Game updated by ${user.username}:`, {
            gameId: id,
            gameName: originalGame.name,
            changes: {
                daily_reset: daily_reset ? `${originalGame.daily_reset} → ${daily_reset}` : 'unchanged',
                timezone: timezone ? `${originalGame.timezone} → ${timezone}` : 'unchanged'
            },
            reason: reason || 'No reason provided',
            updatedBy: user.username,
            timestamp: new Date().toISOString()
        });

        res.json({
            message: 'Game updated successfully',
            game: updatedGame,
            updated_by: user.username,
            update_reason: reason || 'No reason provided',
            changes_made: {
                daily_reset: daily_reset ? `${originalGame.daily_reset} → ${daily_reset}` : null,
                timezone: timezone ? `${originalGame.timezone} → ${timezone}` : null
            }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error updating game:', errorMessage);
        res.status(500).json({ error: 'Failed to update game' });
    }
});

/**
 * @swagger
 * /gdt/closed/games:
 *   post:
 *     summary: Add new game
 *     tags: [Game Management]
 *     security:
 *       - bearerAuth: []
 *     description: Add a new gacha game to the database. Requires authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, server, timezone, daily_reset]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Gacha Game"
 *               server:
 *                 type: string
 *                 example: "Global"
 *               timezone:
 *                 type: string
 *                 example: "Etc/GMT+8"
 *               daily_reset:
 *                 type: string
 *                 pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                 example: "04:00"
 *               icon_name:
 *                 type: string
 *                 example: "new-gacha-game"
 *     responses:
 *       201:
 *         description: Game added successfully
 *       400:
 *         description: Invalid input or game already exists
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
    try {
        const { name, server, timezone, daily_reset, icon_name } = req.body;
        const user = req.user!;

        // Validation
        if (!name || !server || !timezone || !daily_reset) {
            return res.status(400).json({
                error: 'name, server, timezone, and daily_reset are required'
            });
        }

        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(daily_reset)) {
            return res.status(400).json({
                error: 'daily_reset must be in HH:MM format (24-hour)'
            });
        }

        // Check if game already exists
        const existingGame = await database.query(
            'SELECT id FROM games WHERE name = $1 AND server = $2',
            [name, server]
        );

        if (existingGame.rows.length > 0) {
            return res.status(400).json({
                error: `Game "${name}" already exists for server "${server}"`
            });
        }

        // Insert new game
        const result = await database.query(`
      INSERT INTO games (name, server, timezone, daily_reset, icon_name, source)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, server, timezone, daily_reset, icon_name || null, 'user-contributed']);

        const newGame = result.rows[0];

        console.log(`✅ New game added by ${user.username}:`, {
            gameId: newGame.id,
            gameName: name,
            server,
            addedBy: user.username
        });

        res.status(201).json({
            message: 'Game added successfully',
            game: newGame,
            added_by: user.username
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error adding game:', errorMessage);
        res.status(500).json({ error: 'Failed to add game' });
    }
});

export default router;