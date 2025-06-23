import express from 'express';
import database from '../config/database';
import gameDataService from '../services/gameDataService';

const router = express.Router();

/**
 * @swagger
 * /api/games/servers/list:
 *   get:
 *     summary: Get all server regions
 *     tags: [Games]
 *     description: |
 *       Retrieve a list of all available server regions with the number of games
 *       available for each region. Useful for populating filter dropdowns.
 *     responses:
 *       200:
 *         description: Server list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 servers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       server:
 *                         type: string
 *                         description: Server region name
 *                         example: "Global"
 *                       game_count:
 *                         type: string
 *                         description: Number of games in this region
 *                         example: "156"
 */

/**
 * @swagger
 * /api/games:
 *   get:
 *     summary: Get all gacha games
 *     tags: [Games]
 *     description: |
 *       Retrieve all available gacha games with their daily reset times and server information.
 *       Supports filtering by multiple attributes with optional parameters, similar to a book search.
 *       No authentication required - open for everyone to use.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search games by exact or partial name match
 *         example: "Wuthering Waves"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: General search across game names (case-insensitive)
 *         example: ""
 *       - in: query
 *         name: server
 *         schema:
 *           type: string
 *           enum: [Global, JP, KR, CN, SEA, LATAM, EU, America, NA, EN]
 *         description: Filter by exact server region
 *         example: ""
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *         description: Filter by timezone (exact match)
 *         example: "Etc/GMT+5"
 *       - in: query
 *         name: reset_time
 *         schema:
 *           type: string
 *           pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *         description: Filter by daily reset time (HH:MM format)
 *         example: "04:00"
 *       - in: query
 *         name: icon
 *         schema:
 *           type: string
 *         description: Filter by icon name
 *         example: ""
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of games to return (max 100)
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of games to skip for pagination
 *         example: 0
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [name, server, reset_time, timezone]
 *           default: name
 *         description: Sort results by field
 *         example: "name"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *         example: "asc"
 *     responses:
 *       200:
 *         description: Successfully retrieved games
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GameList'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const {
            name,
            search,
            server,
            timezone,
            reset_time,
            icon,
            limit = 50,
            offset = 0,
            sort_by = 'name',
            order = 'asc'
        } = req.query;

        // Validate sort parameters
        const validSortFields = ['name', 'server', 'reset_time', 'timezone', 'daily_reset'];
        const validOrders = ['asc', 'desc'];

        const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'name';
        const sortOrder = validOrders.includes(order as string) ? order : 'asc';

        // Replace sort_by aliases
        const actualSortField = sortField === 'reset_time' ? 'daily_reset' : sortField;

        let query = `
            SELECT id, name, server, timezone, daily_reset, icon_name, last_verified
            FROM games
            WHERE is_active = true
        `;
        const params: any[] = [];
        let paramIndex = 1;

        // Add exact name filter
        if (name) {
            query += ` AND name ILIKE $${paramIndex}`;
            params.push(`%${name}%`);
            paramIndex++;
        }

        // Add general search filter (different from name for flexibility)
        if (search && search !== name) {
            query += ` AND name ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Add server filter
        if (server) {
            query += ` AND server = $${paramIndex}`;
            params.push(server);
            paramIndex++;
        }

        // Add timezone filter
        if (timezone) {
            query += ` AND timezone = $${paramIndex}`;
            params.push(timezone);
            paramIndex++;
        }

        // Add reset time filter
        if (reset_time) {
            query += ` AND daily_reset = $${paramIndex}`;
            params.push(reset_time);
            paramIndex++;
        }

        // Add icon filter
        if (icon) {
            query += ` AND icon_name ILIKE $${paramIndex}`;
            params.push(`%${icon}%`);
            paramIndex++;
        }

        // Add ordering and pagination
        query += ` ORDER BY ${actualSortField} ${(sortOrder as string).toUpperCase()}, id ASC`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit as string), parseInt(offset as string));

        const result = await database.query(query, params);

        // Get total count for pagination (with same filters)
        let countQuery = 'SELECT COUNT(*) FROM games WHERE is_active = true';
        const countParams: any[] = [];
        let countParamIndex = 1;

        if (name) {
            countQuery += ` AND name ILIKE $${countParamIndex}`;
            countParams.push(`%${name}%`);
            countParamIndex++;
        }

        if (search && search !== name) {
            countQuery += ` AND name ILIKE $${countParamIndex}`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        if (server) {
            countQuery += ` AND server = $${countParamIndex}`;
            countParams.push(server);
            countParamIndex++;
        }

        if (timezone) {
            countQuery += ` AND timezone = $${countParamIndex}`;
            countParams.push(timezone);
            countParamIndex++;
        }

        if (reset_time) {
            countQuery += ` AND daily_reset = $${countParamIndex}`;
            countParams.push(reset_time);
            countParamIndex++;
        }

        if (icon) {
            countQuery += ` AND icon_name ILIKE $${countParamIndex}`;
            countParams.push(`%${icon}%`);
            countParamIndex++;
        }

        const countResult = await database.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            games: result.rows,
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            filters_applied: {
                name: name || null,
                search: search || null,
                server: server || null,
                timezone: timezone || null,
                reset_time: reset_time || null,
                icon: icon || null,
                sort_by: sortField,
                order: sortOrder
            }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching games:', errorMessage);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});

/**
 * @swagger
 * /api/games/{id}:
 *   get:
 *     summary: Get specific game by ID
 *     tags: [Games]
 *     description: Retrieve detailed information about a specific gacha game by its unique identifier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique game identifier
 *         example: 1
 *     responses:
 *       200:
 *         description: Game found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *             example:
 *               game:
 *                 id: 1
 *                 name: "Azur Lane"
 *                 server: "EN"
 *                 timezone: "Etc/GMT+7"
 *                 daily_reset: "00:00"
 *                 icon_name: "azur-lane-en"
 *                 last_verified: "2025-01-20T10:30:00.000Z"
 *       404:
 *         description: Game not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Game not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await database.query(
            'SELECT * FROM games WHERE id = $1 AND is_active = true',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }

        res.json({ game: result.rows[0] });

    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'Failed to fetch game' });
    }
});

/**
 * @swagger
 * /api/games/import:
 *   post:
 *     summary: Import/Update game data
 *     tags: [Data Management]
 *     description: |
 *       Import or update game data from external sources. This endpoint fetches the latest
 *       game information from the Game-Time-Master repository and updates the database.
 *       Use `forceRefresh: true` to bypass cache and get the latest data.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forceRefresh:
 *                 type: boolean
 *                 default: false
 *                 description: Force refresh from external source, bypassing cache
 *           examples:
 *             normal_import:
 *               summary: Normal import (uses cache if available)
 *               value:
 *                 forceRefresh: false
 *             force_refresh:
 *               summary: Force refresh from source
 *               value:
 *                 forceRefresh: true
 *     responses:
 *       200:
 *         description: Data imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imported:
 *                   type: integer
 *                   description: Number of new games added
 *                   example: 25
 *                 updated:
 *                   type: integer
 *                   description: Number of existing games updated
 *                   example: 278
 *                 total:
 *                   type: integer
 *                   description: Total number of games processed
 *                   example: 303
 *                 source:
 *                   type: string
 *                   description: Data source used
 *                   enum: ["external", "cache/backup"]
 *                   example: "external"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: When the import was completed
 *       500:
 *         description: Import failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/import', async (req, res) => {
    try {
        const { forceRefresh = false } = req.body;

        console.log('🔄 Starting game data import...');

        // Get game data from service
        const gameData = forceRefresh
            ? await gameDataService.refreshFromSource()
            : await gameDataService.getGameData();

        let imported = 0;
        let updated = 0;

        // Import each game
        for (const game of gameData) {
            try {
                const insertResult = await database.query(`
                    INSERT INTO games (name, server, timezone, daily_reset, icon_name, source)
                    VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (name, server) 
          DO UPDATE SET
                        timezone = EXCLUDED.timezone,
                                         daily_reset = EXCLUDED.daily_reset,
                                         icon_name = EXCLUDED.icon_name,
                                         last_verified = CURRENT_TIMESTAMP
                                         RETURNING (xmax = 0) AS inserted
                `, [game.game, game.server, game.timezone, game.dailyReset, game.icon, 'game-time-master']);

                if (insertResult.rows[0].inserted) {
                    imported++;
                } else {
                    updated++;
                }

            } catch (gameError) {
                console.error(`Failed to import game: ${game.game} (${game.server})`, gameError);
            }
        }

        console.log(`✅ Import complete: ${imported} new, ${updated} updated`);

        res.json({
            imported,
            updated,
            total: gameData.length,
            source: forceRefresh ? 'external' : 'cache/backup',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error importing games:', error);
        res.status(500).json({ error: 'Failed to import game data' });
    }
});

/**
 * @swagger
 * /api/games/servers/list:
 *   get:
 *     summary: Get all server regions
 *     tags: [Games]
 *     description: |
 *       Retrieve a list of all available server regions with the number of games
 *       available for each region. Useful for populating filter dropdowns.
 *     responses:
 *       200:
 *         description: Server list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 servers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       server:
 *                         type: string
 *                         description: Server region name
 *                         example: "Global"
 *                       game_count:
 *                         type: string
 *                         description: Number of games in this region
 *                         example: "156"
 *             example:
 *               servers:
 *                 - server: "Global"
 *                   game_count: "156"
 *                 - server: "JP"
 *                   game_count: "89"
 *                 - server: "KR"
 *                   game_count: "34"
 *                 - server: "CN"
 *                   game_count: "24"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/servers/list', async (req, res) => {
    try {
        const result = await database.query(`
            SELECT server, COUNT(*) as game_count
            FROM games
            WHERE is_active = true
            GROUP BY server
            ORDER BY game_count DESC, server
        `);

        res.json({ servers: result.rows });

    } catch (error) {
        console.error('Error fetching servers:', error);
        res.status(500).json({ error: 'Failed to fetch servers' });
    }
});

export default router;