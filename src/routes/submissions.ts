import express, { Request, Response, Router } from 'express';
import database from '../config/database';
import { requireAdmin, getRoleName } from '../middleware/admin';
import TimezoneService from '../services/timezoneService';

const submissionsRouter: Router = express.Router();
const adminSubmissionsRouter: Router = express.Router();

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * @swagger
 * /gdt/submissions:
 *   post:
 *     summary: Submit a game for admin review
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
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
 *                 maxLength: 255
 *               server:
 *                 type: string
 *                 maxLength: 100
 *               timezone:
 *                 type: string
 *               daily_reset:
 *                 type: string
 *                 example: "04:00"
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Submission received
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate game or pending submission already exists
 */
submissionsRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { name, server, timezone, daily_reset, notes } = req.body;
        const userId = req.user!.userId;

        const cleanName   = typeof name   === 'string' ? name.trim()   : '';
        const cleanServer = typeof server === 'string' ? server.trim() : '';

        if (!cleanName || cleanName.length > 255) {
            return res.status(400).json({ error: 'Game name is required (1–255 characters)' });
        }
        if (!cleanServer || cleanServer.length > 100) {
            return res.status(400).json({ error: 'Server is required (1–100 characters)' });
        }
        if (!timezone || !TimezoneService.isValidTimezone(timezone)) {
            return res.status(400).json({ error: 'Valid timezone is required' });
        }
        if (!daily_reset || !TIME_RE.test(daily_reset)) {
            return res.status(400).json({ error: 'Daily reset must be in HH:MM format' });
        }
        if (notes && typeof notes === 'string' && notes.length > 500) {
            return res.status(400).json({ error: 'Notes must be 500 characters or fewer' });
        }

        // Duplicate game check
        const existing = await database.query(
            'SELECT id FROM games WHERE LOWER(name) = LOWER($1) AND LOWER(server) = LOWER($2)',
            [cleanName, cleanServer]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'This game already exists in the database' });
        }

        // Duplicate pending submission check
        const pendingSub = await database.query(
            `SELECT id FROM game_submissions
             WHERE LOWER(name) = LOWER($1) AND LOWER(server) = LOWER($2) AND status = 'pending'`,
            [cleanName, cleanServer]
        );
        if (pendingSub.rows.length > 0) {
            return res.status(409).json({ error: 'A submission for this game is already pending review' });
        }

        // authenticateToken hardcodes role=1; fetch actual role from DB
        const userResult = await database.query('SELECT role FROM users WHERE id = $1', [userId]);
        const submitterRole = userResult.rows[0]?.role ?? 1;

        const result = await database.query(
            `INSERT INTO game_submissions
               (submitted_by, submitter_role, name, server, timezone, daily_reset, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, server, status`,
            [userId, submitterRole, cleanName, cleanServer, timezone, daily_reset,
             typeof notes === 'string' ? notes.trim() || null : null]
        );

        console.log(`📬 Game submitted by user ${userId}: "${cleanName}" (${cleanServer})`);

        res.status(201).json({
            message: 'Submission received. An admin will review it shortly.',
            submission: result.rows[0],
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Submission error:', msg);
        res.status(500).json({ error: 'Failed to submit game' });
    }
});

/**
 * @swagger
 * /gdt/admin/submissions:
 *   get:
 *     summary: List game submissions (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, all]
 *           default: pending
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Paginated list of submissions
 */
adminSubmissionsRouter.get('/submissions', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { status = 'pending', limit = '20', offset = '0' } = req.query;
        const validStatuses = ['pending', 'approved', 'rejected', 'all'];
        const statusFilter = validStatuses.includes(status as string)
            ? (status as string)
            : 'pending';

        const params: unknown[] = [];
        let where = '';
        if (statusFilter !== 'all') {
            where = 'WHERE gs.status = $1';
            params.push(statusFilter);
        }

        const [countResult, result] = await Promise.all([
            database.query(
                `SELECT COUNT(*) FROM game_submissions gs ${where}`,
                params
            ),
            database.query(
                `SELECT
                   gs.id, gs.name, gs.server, gs.timezone, gs.daily_reset,
                   gs.notes, gs.status, gs.submitter_role,
                   gs.review_notes, gs.reviewed_at, gs.created_at,
                   u_reviewer.role AS reviewed_by_role
                 FROM game_submissions gs
                 LEFT JOIN users u_reviewer ON gs.reviewed_by = u_reviewer.id
                 ${where}
                 ORDER BY gs.created_at DESC
                 LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
                [...params, parseInt(limit as string), parseInt(offset as string)]
            ),
        ]);

        const submissions = result.rows.map(row => ({
            ...row,
            submitter_role_name: getRoleName(row.submitter_role),
            reviewed_by_role_name: row.reviewed_by_role != null
                ? getRoleName(row.reviewed_by_role)
                : null,
        }));

        res.json({
            submissions,
            total: parseInt(countResult.rows[0].count),
            status_filter: statusFilter,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Submissions list error:', msg);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

/**
 * @swagger
 * /gdt/admin/submissions/{id}:
 *   patch:
 *     summary: Approve or reject a game submission (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               review_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Submission reviewed successfully
 *       400:
 *         description: Invalid action or submission already reviewed
 *       404:
 *         description: Submission not found
 */
adminSubmissionsRouter.patch('/submissions/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { action, review_notes } = req.body;
        const adminId = req.user!.userId;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
        }

        const subResult = await database.query(
            'SELECT * FROM game_submissions WHERE id = $1',
            [id]
        );
        if (subResult.rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const sub = subResult.rows[0];
        if (sub.status !== 'pending') {
            return res.status(400).json({ error: `Submission is already ${sub.status}` });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        await database.query(
            `UPDATE game_submissions
             SET status = $1, reviewed_by = $2, review_notes = $3, reviewed_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [newStatus, adminId,
             typeof review_notes === 'string' ? review_notes.trim() || null : null,
             id]
        );

        if (action === 'approve') {
            await database.query(
                `INSERT INTO games (name, server, timezone, daily_reset, is_active, source)
                 VALUES ($1, $2, $3, $4, false, 'user-submission')
                 ON CONFLICT (name, server) DO NOTHING`,
                [sub.name, sub.server, sub.timezone, sub.daily_reset]
            );
            console.log(`✅ Submission #${id} approved by admin ${adminId}: "${sub.name}" (${sub.server})`);
            return res.json({
                message: 'Approved and added to games (inactive). Activate it in the Games panel.',
            });
        }

        console.log(`❌ Submission #${id} rejected by admin ${adminId}: "${sub.name}" (${sub.server})`);
        res.json({ message: 'Submission rejected.' });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Submission review error:', msg);
        res.status(500).json({ error: 'Failed to review submission' });
    }
});

export { submissionsRouter, adminSubmissionsRouter };
