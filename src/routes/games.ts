import express from 'express';
import database from '../config/database';
import gameDataService from '../services/gameDataService';

const router = express.Router();

/**
 * @swagger
 * /gdt/games/servers/list:
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
 *                 totalGameCount:
 *                   type: number
 *                   description: Total number of games across all servers
 *                   example: 303
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
 *               totalGameCount: 303
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

        // Calculate total game count across all servers
        const totalGameCount = result.rows.reduce((total, row) => {
            return total + parseInt(row.game_count);
        }, 0);

        res.json({
            totalGameCount,
            servers: result.rows
        });
    } catch (error) {
        console.error('Error fetching servers:', error);
        res.status(500).json({ error: 'Failed to fetch servers' });
    }
});

/**
 * @swagger
 * /gdt/games:
 *   get:
 *     summary: Get all gacha games
 *     tags: [Games]
 *     description: |
 *       Retrieve all available gacha games with their daily reset times and server information.
 *       Supports filtering by multiple attributes and can show deleted games for restoration purposes.
 *       No authentication required for viewing - open for everyone to use.
 *     parameters:
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include soft-deleted games in results (shows status field)
 *         example: false
 *       - in: query
 *         name: deletedOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Show only soft-deleted games (for finding games to restore)
 *         example: false
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
 *           enum: [name, server, reset_time, timezone, id]
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
 *               type: object
 *               properties:
 *                 games:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Game'
 *                       - type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                             enum: ["active", "deleted"]
 *                             description: Game status (only present when includeDeleted=true)
 *                 total:
 *                   type: integer
 *                   description: Total games matching filters
 *                 active_count:
 *                   type: integer
 *                   description: Number of active games (only when includeDeleted=true)
 *                 deleted_count:
 *                   type: integer
 *                   description: Number of deleted games (only when includeDeleted=true)
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 filters_applied:
 *                   type: object
 *             examples:
 *               normal_response:
 *                 summary: Normal response (active games only)
 *                 value:
 *                   games: []
 *                   total: 303
 *                   limit: 50
 *                   offset: 0
 *                   filters_applied: {}
 *               with_deleted:
 *                 summary: Response including deleted games
 *                 value:
 *                   games: []
 *                   total: 305
 *                   active_count: 303
 *                   deleted_count: 2
 *                   limit: 50
 *                   offset: 0
 *                   filters_applied: {}
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const {
            includeDeleted = false,
            deletedOnly = false,
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

        // Validate limit parameter (min: 1, max: 100, default: 50)
        let validatedLimit = parseInt(limit as string) || 50;
        if (validatedLimit < 1) validatedLimit = 1;
        if (validatedLimit > 100) validatedLimit = 100;

        // Validate offset parameter (min: 0, default: 0)
        let validatedOffset = parseInt(offset as string) || 0;
        if (validatedOffset < 0) validatedOffset = 0;

        // Validate sort parameters
        const validSortFields = ['name', 'server', 'reset_time', 'timezone', 'daily_reset','id'];
        const validOrders = ['asc', 'desc'];

        const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'name';
        const sortOrder = validOrders.includes(order as string) ? order : 'asc';

        // sort_by aliases
        let actualSortField = sortField;
        if (sortField === 'reset_time') {
            actualSortField = 'daily_reset';
        } else if (sortField === 'id') {
            actualSortField = 'id';
        } else {
            actualSortField = sortField;
        }

        // Determine status filter based on query parameters
        let statusFilter = '';
        if (deletedOnly === 'true') {
            statusFilter = 'WHERE is_active = false';
        } else if (includeDeleted === 'true') {
            statusFilter = ''; // No filter - show all games
        } else {
            statusFilter = 'WHERE is_active = true'; // Default - only active games
        }

        // Build the select clause - include status when showing deleted games
        const selectClause = (includeDeleted === 'true' || deletedOnly === 'true')
            ? `SELECT id, name, server, timezone, daily_reset, icon_name, last_verified, 
                      CASE WHEN is_active THEN 'active' ELSE 'deleted' END as status`
            : `SELECT id, name, server, timezone, daily_reset, icon_name, last_verified`;

        let query = `
            ${selectClause}
            FROM games
            ${statusFilter}
        `;

        const params: any[] = [];
        let paramIndex = 1;

        // Add filters (same logic as before, but append to existing WHERE clause)
        const filterConditions: string[] = [];

        if (name) {
            filterConditions.push(`name ILIKE $${paramIndex}`);
            params.push(`%${name}%`);
            paramIndex++;
        }

        if (search && search !== name) {
            filterConditions.push(`name ILIKE $${paramIndex}`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (server) {
            filterConditions.push(`server = $${paramIndex}`);
            params.push(server);
            paramIndex++;
        }

        if (timezone) {
            filterConditions.push(`timezone = $${paramIndex}`);
            params.push(timezone);
            paramIndex++;
        }

        if (reset_time) {
            filterConditions.push(`daily_reset = $${paramIndex}`);
            params.push(reset_time);
            paramIndex++;
        }

        if (icon) {
            filterConditions.push(`icon_name ILIKE $${paramIndex}`);
            params.push(`%${icon}%`);
            paramIndex++;
        }

        // Append additional filter conditions
        if (filterConditions.length > 0) {
            const connector = statusFilter ? ' AND ' : ' WHERE ';
            query += connector + filterConditions.join(' AND ');
        }

        // Add ordering and pagination
        query += ` ORDER BY ${actualSortField} ${(sortOrder as string).toUpperCase()}, id ASC`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(validatedLimit, validatedOffset);

        const result = await database.query(query, params);

        // Build count query with same filters
        let baseCountQuery = '';
        if (deletedOnly === 'true') {
            baseCountQuery = 'SELECT COUNT(*) FROM games WHERE is_active = false';
        } else if (includeDeleted === 'true') {
            baseCountQuery = 'SELECT COUNT(*) FROM games';
        } else {
            baseCountQuery = 'SELECT COUNT(*) FROM games WHERE is_active = true';
        }

        let countQuery = baseCountQuery;
        const countParams: any[] = [];
        let countParamIndex = 1;

        // Apply same filters to count query
        const countFilterConditions: string[] = [];

        if (name) {
            countFilterConditions.push(`name ILIKE $${countParamIndex}`);
            countParams.push(`%${name}%`);
            countParamIndex++;
        }

        if (search && search !== name) {
            countFilterConditions.push(`name ILIKE $${countParamIndex}`);
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        if (server) {
            countFilterConditions.push(`server = $${countParamIndex}`);
            countParams.push(server);
            countParamIndex++;
        }

        if (timezone) {
            countFilterConditions.push(`timezone = $${countParamIndex}`);
            countParams.push(timezone);
            countParamIndex++;
        }

        if (reset_time) {
            countFilterConditions.push(`daily_reset = $${countParamIndex}`);
            countParams.push(reset_time);
            countParamIndex++;
        }

        if (icon) {
            countFilterConditions.push(`icon_name ILIKE $${countParamIndex}`);
            countParams.push(`%${icon}%`);
            countParamIndex++;
        }

        if (countFilterConditions.length > 0) {
            const connector = (deletedOnly === 'true' || includeDeleted !== 'true') ? ' AND ' : ' WHERE ';
            countQuery += connector + countFilterConditions.join(' AND ');
        }

        const countResult = await database.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        // Prepare response object
        const response: any = {
            games: result.rows,
            total,
            limit: validatedLimit,
            offset: validatedOffset,
            filters_applied: {
                includeDeleted: includeDeleted === 'true' ? true : false,
                deletedOnly: deletedOnly === 'true' ? true : false,
                name: name || null,
                search: search || null,
                server: server || null,
                timezone: timezone || null,
                reset_time: reset_time || null,
                icon: icon || null,
                sort_by: sortField,
                order: sortOrder
            }
        };

        // Add count breakdown when including deleted games
        if (includeDeleted === 'true') {
            const activeCountResult = await database.query(
                `SELECT COUNT(*) FROM games WHERE is_active = true ${countFilterConditions.length > 0 ? 'AND ' + countFilterConditions.join(' AND ') : ''}`,
                countParams
            );
            const deletedCountResult = await database.query(
                `SELECT COUNT(*) FROM games WHERE is_active = false ${countFilterConditions.length > 0 ? 'AND ' + countFilterConditions.join(' AND ') : ''}`,
                countParams
            );

            response.active_count = parseInt(activeCountResult.rows[0].count);
            response.deleted_count = parseInt(deletedCountResult.rows[0].count);
        }

        res.json(response);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching games:', errorMessage);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});


/**
 * @swagger
 * /gdt/games/deleted:
 *   get:
 *     summary: Get only soft-deleted games
 *     tags: [Games]
 *     description: |
 *       Retrieve only soft-deleted games for restoration purposes.
 *       Shows all deleted games by default, with optional search filtering.
 *       Always returns results even without parameters.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Optional search deleted games by name
 *         example: "test game"
 *       - in: query
 *         name: server
 *         schema:
 *           type: string
 *         description: Optional filter by server region
 *         example: "Global"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of games to return
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of games to skip for pagination
 *         example: 0
 *     responses:
 *       200:
 *         description: List of soft-deleted games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted_games:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Game'
 *                       - type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                             enum: ["deleted"]
 *                 total_deleted:
 *                   type: integer
 *                   description: Total number of deleted games matching filters
 *                 restoration_info:
 *                   type: object
 *                   properties:
 *                     method1:
 *                       type: string
 *                       description: Update route method
 *                     method2:
 *                       type: string
 *                       description: Restore route method
 *             example:
 *               deleted_games:
 *                 - id: 304
 *                   name: "New Gacha Game"
 *                   server: "Global"
 *                   timezone: "Etc/GMT+8"
 *                   daily_reset: "04:00:00"
 *                   icon_name: "new-gacha-game"
 *                   last_verified: "2025-07-17T22:01:18.967Z"
 *                   status: "deleted"
 *               total_deleted: 1
 *               restoration_info:
 *                 method1: "PATCH /gdt/update/games/{id} with body: {\"is_active\": true, \"reason\": \"restoration reason\"}"
 *                 method2: "POST /gdt/update/restore/game/{id} with body: {\"reason\": \"restoration reason\"}"
 *       500:
 *         description: Server error
 */
router.get('/deleted', async (req, res) => {
    try {
        const {
            search,
            server,
            limit,
            offset
        } = req.query;

        // Validate and set defaults for limit and offset
        let validatedLimit = 50; // default
        let validatedOffset = 0; // default

        if (limit) {
            const parsedLimit = parseInt(limit as string);
            if (!isNaN(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 100) {
                validatedLimit = parsedLimit;
            }
        }

        if (offset) {
            const parsedOffset = parseInt(offset as string);
            if (!isNaN(parsedOffset) && parsedOffset >= 0) {
                validatedOffset = parsedOffset;
            }
        }

        // Base query - always get deleted games
        let query = `
            SELECT id, name, server, timezone, daily_reset, icon_name, last_verified
            FROM games
            WHERE is_active = false
        `;

        const params: any[] = [];
        let paramIndex = 1;

        // Add optional search filter
        if (search && search.toString().trim() !== '') {
            query += ` AND name ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Add optional server filter
        if (server && server.toString().trim() !== '') {
            query += ` AND server = $${paramIndex}`;
            params.push(server);
            paramIndex++;
        }

        // Order by most recently deleted first, then by name for consistency
        query += ` ORDER BY last_verified DESC, name ASC, id ASC`;

        // Add pagination
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(validatedLimit, validatedOffset);

        console.log('🔍 Executing deleted games query:', query);
        console.log('📋 With parameters:', params);

        const result = await database.query(query, params);

        // Get total count of deleted games matching the same filters
        let countQuery = 'SELECT COUNT(*) FROM games WHERE is_active = false';
        const countParams: any[] = [];
        let countParamIndex = 1;

        if (search && search.toString().trim() !== '') {
            countQuery += ` AND name ILIKE $${countParamIndex}`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        if (server && server.toString().trim() !== '') {
            countQuery += ` AND server = $${countParamIndex}`;
            countParams.push(server);
            countParamIndex++;
        }

        const countResult = await database.query(countQuery, countParams);
        const totalDeleted = parseInt(countResult.rows[0].count);

        console.log(`📊 Found ${result.rows.length} deleted games (${totalDeleted} total)`);

        // Add status to each game for consistency
        const gamesWithStatus = result.rows.map(game => ({
            ...game,
            status: 'soft deleted'
        }));

        res.json({
            deleted_games: gamesWithStatus,
            total_deleted: totalDeleted,
            limit: validatedLimit,
            offset: validatedOffset,
            filters_applied: {
                search: search ? search.toString() : null,
                server: server ? server.toString() : null
            },
            restoration_info: {
                method1: "PATCH /gdt/update/games/{id} with body: {\"is_active\": true, \"reason\": \"restoration reason\"}"
            }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching deleted games:', errorMessage);
        res.status(500).json({
            error: 'Failed to fetch deleted games',
            details: errorMessage
        });
    }
});

/**
 * @swagger
 * /gdt/games/{id}:
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

export default router;