import express, { Router, Request, Response } from 'express';
import TimezoneService from '../services/timezoneService';

const timezoneRoutes: Router = express.Router();

/**
 * @swagger
 * /gdt/timezones:
 *   get:
 *     summary: Get supported timezones
 *     tags: [Utilities]
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
timezoneRoutes.get('/', (req: Request, res: Response) => {
    const timezones = TimezoneService.getAllTimezones();
    res.json({ timezones });
});

/**
 * @swagger
 * /gdt/timezones/detect:
 *   get:
 *     summary: Auto-detect user timezone
 *     tags: [Utilities]
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
timezoneRoutes.get('/detect', async (req: Request, res: Response) => {
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

export { timezoneRoutes };