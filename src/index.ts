import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import database from './config/database';
import gameRoutes from './routes/games';
import { authRoutes } from './routes/auth';
import autoImportService from './services/autoImportService';
import { specs, swaggerUi, swaggerOptions } from './config/swagger';

// Load environment variables - try multiple file names
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Routes
app.use('/api/games', gameRoutes);
app.use('/api/auth', authRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Information
 *     tags: [Health]
 *     description: Get basic information about the Gacha Daily Tracker API
 *     responses:
 *       200:
 *         description: API information and available endpoints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Gacha Daily Tracker API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 status:
 *                   type: string
 *                   example: "running"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     games:
 *                       type: string
 *                       example: "/api/games"
 *                     health:
 *                       type: string
 *                       example: "/health"
 *                     docs:
 *                       type: string
 *                       example: "/api-docs"
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Gacha Daily Tracker API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            games: '/api/games',
            auth: '/api/auth',
            health: '/health',
            import: '/api/games/import',
            docs: '/api-docs'
        }
    });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health Check
 *     tags: [Health]
 *     description: Check the health status of the API and database connection
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *       500:
 *         description: System error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await database.healthCheck();
        const backupInfo = await autoImportService.getBackupInfo();

        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: dbHealth,
            backup_file: backupInfo
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: errorMessage
        });
    }
});

// Auto-import data on startup
async function initializeApp() {
    try {
        console.log('🚀 Starting Gacha Daily Tracker API...');

        // Wait a moment for database to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check and auto-import initial data
        await autoImportService.checkAndImportInitialData();

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Local: http://localhost:${PORT}`);
            console.log(`🎮 Games API: http://localhost:${PORT}/api/games`);
            console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
            console.log(`💚 Health check: http://localhost:${PORT}/health`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Failed to initialize app:', errorMessage);
        process.exit(1);
    }
}

// Initialize the app
initializeApp();

export default app;
