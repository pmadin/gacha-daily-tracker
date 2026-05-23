import express, { Router } from 'express';
import database from '../config/database';

const scheduleRouter: Router = express.Router();

interface ScheduleRow {
  id: number;
  game_id: number;
  days_of_week: number[];
  window_start: string;
  window_end: string;
  hook_notifications: boolean;
  created_at: string;
  game_name: string;
  server: string;
  icon_name: string | null;
  game_timezone: string;
  daily_reset: string;
}

/**
 * @swagger
 * /gdt/schedule/today:
 *   get:
 *     summary: Get today's scheduled play windows
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     description: Returns all play schedules active for the current day of the week, computed in the user's timezone.
 *     responses:
 *       200:
 *         description: Schedules for today with day_of_week (0=Sun … 6=Sat)
 *       401:
 *         description: Unauthorized
 */
// GET /gdt/schedule/today — must come before /:gameId
scheduleRouter.get('/today', async (req, res) => {
  const userId = req.user!.userId;

  try {
    const todayQuery = await database.query(
      `SELECT EXTRACT(DOW FROM CURRENT_TIMESTAMP AT TIME ZONE u.timezone)::int AS dow
       FROM users u WHERE u.id = $1`,
      [userId]
    );
    const todayDow: number = todayQuery.rows[0]?.dow ?? new Date().getDay();

    const result = await database.query(
      `SELECT
        ps.*,
        g.name AS game_name,
        g.server,
        g.icon_name,
        g.timezone AS game_timezone,
        g.daily_reset
       FROM play_schedules ps
       JOIN games g ON g.id = ps.game_id
       WHERE ps.user_id = $1
         AND ($2 = ANY(ps.days_of_week) OR ps.days_of_week = '{}')
       ORDER BY ps.window_start ASC`,
      [userId, todayDow]
    );

    return res.json({ schedules: result.rows, day_of_week: todayDow });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Schedule today error:', msg);
    return res.status(500).json({ error: 'Failed to fetch today\'s schedule' });
  }
});

/**
 * @swagger
 * /gdt/schedule/week:
 *   get:
 *     summary: Get play schedules organised by day of week
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     description: Returns a week object keyed 0–6 where each value is the array of schedules active on that day.
 *     responses:
 *       200:
 *         description: Week object keyed by DOW (0=Sun … 6=Sat)
 *       401:
 *         description: Unauthorized
 */
// GET /gdt/schedule/week — must come before /:gameId
scheduleRouter.get('/week', async (req, res) => {
  const userId = req.user!.userId;

  try {
    const result = await database.query(
      `SELECT ps.*, g.name AS game_name, g.server, g.icon_name,
              g.timezone AS game_timezone, g.daily_reset
       FROM play_schedules ps
       JOIN games g ON g.id = ps.game_id
       WHERE ps.user_id = $1
       ORDER BY ps.window_start ASC`,
      [userId]
    );

    const week: Record<number, ScheduleRow[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const row of result.rows) {
      const days: number[] = row.days_of_week.length === 0
        ? [0, 1, 2, 3, 4, 5, 6]
        : row.days_of_week;
      days.forEach((d: number) => week[d].push(row));
    }

    return res.json({ week });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Schedule week error:', msg);
    return res.status(500).json({ error: 'Failed to fetch week schedule' });
  }
});

/**
 * @swagger
 * /gdt/schedule:
 *   get:
 *     summary: List all play schedules for the authenticated user
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of play schedules with game info
 *       401:
 *         description: Unauthorized
 */
// GET /gdt/schedule
scheduleRouter.get('/', async (req, res) => {
  const userId = req.user!.userId;

  try {
    const result = await database.query(
      `SELECT
        ps.id,
        ps.game_id,
        ps.days_of_week,
        ps.window_start,
        ps.window_end,
        ps.hook_notifications,
        ps.created_at,
        g.name        AS game_name,
        g.server,
        g.icon_name,
        g.timezone    AS game_timezone,
        g.daily_reset
       FROM play_schedules ps
       JOIN games g ON g.id = ps.game_id
       WHERE ps.user_id = $1
       ORDER BY ps.window_start ASC`,
      [userId]
    );

    return res.json({ schedules: result.rows });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Schedule list error:', msg);
    return res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

/**
 * @swagger
 * /gdt/schedule:
 *   post:
 *     summary: Create or update a play schedule for a game
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     description: Upserts a play window for a tracked game. The game must already be in the user's tracked list.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [game_id, window_start, window_end]
 *             properties:
 *               game_id:
 *                 type: integer
 *               days_of_week:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Days 0–6 (Sun–Sat). Empty array means every day.
 *               window_start:
 *                 type: string
 *                 example: "19:00"
 *               window_end:
 *                 type: string
 *                 example: "21:00"
 *               hook_notifications:
 *                 type: boolean
 *                 description: Send push notification at window start instead of daily reset offset
 *     responses:
 *       200:
 *         description: Schedule saved
 *       400:
 *         description: Validation error or game not tracked
 *       401:
 *         description: Unauthorized
 */
// POST /gdt/schedule
scheduleRouter.post('/', async (req, res) => {
  const userId = req.user!.userId;
  const { game_id, days_of_week, window_start, window_end, hook_notifications } = req.body;

  if (!game_id) return res.status(400).json({ error: 'game_id is required' });
  if (!window_start || !window_end) {
    return res.status(400).json({ error: 'window_start and window_end are required' });
  }

  const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
  if (!timeRegex.test(window_start) || !timeRegex.test(window_end)) {
    return res.status(400).json({ error: 'window_start and window_end must be HH:MM format' });
  }

  const startParts = window_start.split(':');
  const endParts = window_end.split(':');
  const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
  const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
  if (endMinutes <= startMinutes) {
    return res.status(400).json({ error: 'window_end must be after window_start' });
  }

  const days: number[] = Array.isArray(days_of_week) ? days_of_week : [];
  if (days.length > 0 && !days.every((d: unknown) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)) {
    return res.status(400).json({ error: 'days_of_week must be integers 0–6' });
  }

  try {
    const tracked = await database.query(
      `SELECT id FROM user_games WHERE user_id = $1 AND game_id = $2`,
      [userId, game_id]
    );
    if (tracked.rows.length === 0) {
      return res.status(400).json({ error: 'You can only schedule games you are tracking' });
    }

    await database.query(
      `INSERT INTO play_schedules
        (user_id, game_id, days_of_week, window_start, window_end, hook_notifications)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, game_id) DO UPDATE SET
         days_of_week       = EXCLUDED.days_of_week,
         window_start       = EXCLUDED.window_start,
         window_end         = EXCLUDED.window_end,
         hook_notifications = EXCLUDED.hook_notifications,
         updated_at         = CURRENT_TIMESTAMP`,
      [userId, game_id, days, window_start, window_end, hook_notifications ?? false]
    );

    return res.json({ message: 'Schedule saved' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Schedule save error:', msg);
    return res.status(500).json({ error: 'Failed to save schedule' });
  }
});

/**
 * @swagger
 * /gdt/schedule/{gameId}:
 *   delete:
 *     summary: Remove a play schedule for a game
 *     tags: [Schedule]
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
 *         description: Schedule removed
 *       400:
 *         description: Invalid game ID
 *       401:
 *         description: Unauthorized
 */
// DELETE /gdt/schedule/:gameId
scheduleRouter.delete('/:gameId', async (req, res) => {
  const userId = req.user!.userId;
  const gameId = parseInt(req.params.gameId, 10);

  if (isNaN(gameId)) return res.status(400).json({ error: 'Invalid game ID' });

  try {
    await database.query(
      `DELETE FROM play_schedules WHERE user_id = $1 AND game_id = $2`,
      [userId, gameId]
    );
    return res.json({ message: 'Schedule removed' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Schedule delete error:', msg);
    return res.status(500).json({ error: 'Failed to remove schedule' });
  }
});

export default scheduleRouter;
