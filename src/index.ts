import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import database from './config/database';
import gameRoutes from './routes/games';
import { authRoutes } from './routes/auth';
import { timezoneRoutes } from "./routes/timezone";
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

// Serve static files - handle both development and production paths
const publicPaths = [
    path.join(__dirname, 'public'),           // Production: dist/public
    path.join(__dirname, '..', 'src', 'public'), // Development: from dist/ to src/public
    path.join(process.cwd(), 'src', 'public'), // Development: from root to src/public
    path.join(process.cwd(), 'dist', 'public'), // Production: from root to dist/public
    path.join(process.cwd(), 'public')        // Fallback: root/public
];

// Try each path and use the first one that exists
let publicPath = publicPaths[0]; // Default fallback
const fs = require('fs');
for (const testPath of publicPaths) {
    try {
        if (fs.existsSync(testPath)) {
            publicPath = testPath;
            console.log(`📁 Using public directory: ${publicPath}`);
            break;
        } else {
            console.log(`📁 Path not found: ${testPath}`);
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`📁 Error checking path ${testPath}:`, errorMessage);
    }
}

app.use('/public', express.static(publicPath));

// API Documentation
app.use('/gdt/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Routes
app.use('/gdt/games', gameRoutes);
app.use('/gdt/timezones', timezoneRoutes);
app.use('/gdt/auth', authRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Information (Root)
 *     tags: [Health]
 *     description: Root endpoint - redirects to API documentation
 *     responses:
 *       302:
 *         description: Redirect to API documentation
 */
app.get('/', (req, res) => {
    // Redirect to API docs for better user experience
    res.redirect('/gdt/api-docs');
});

/**
 * @swagger
 * /gdt/:
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
 *                       example: "/gdt/games"
 *                     auth:
 *                       type: string
 *                       example: "/gdt/auth"
 *                     timezones:
 *                       type: string
 *                       example: "/gdt/timezones"
 *                     health:
 *                       type: string
 *                       example: "/gdt/health"
 *                     import:
 *                       type: string
 *                       example: "/gdt/games/import"
 *                     docs:
 *                       type: string
 *                       example: "/gdt/api-docs"
 */
app.get('/gdt/', (req, res) => {
    res.json({
        message: 'Gacha Daily Tracker API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            games: '/gdt/games',
            auth: '/gdt/auth',
            timezones: '/gdt/timezones',
            health: '/gdt/health',
            status: '/gdt/status',
            import: '/gdt/games/import',
            docs: '/gdt/api-docs'
        }
    });
});

/**
 * @swagger
 * /gdt/health:
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
app.get('/gdt/health', async (req, res) => {
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

// Serve the status.js file directly as a fallback
app.get('/public/status.js', (req, res) => {
    const statusJS = `
// Status page JavaScript
console.log('Status.js loaded successfully');

async function checkStatus() {
    console.log('checkStatus function called');
    
    const statusCard = document.getElementById('statusCard');
    const overallStatus = document.getElementById('overallStatus');
    const statusText = document.getElementById('statusText');
    const timestamp = document.getElementById('timestamp');
    const servicesDiv = document.getElementById('services');
    const lastUpdated = document.getElementById('lastUpdated');

    // Show loading state
    statusCard.classList.add('loading');
    statusText.textContent = 'Checking...';

    try {
        // Fetch status from the current domain
        console.log('Fetching status from /gdt/health...');
        const response = await fetch('/gdt/health');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        
        const data = await response.json();
        console.log('Data received:', data);

        // Update overall status
        const isHealthy = data.status === 'OK' && data.database?.status === 'healthy';
        
        overallStatus.className = \`status-indicator \${isHealthy ? 'status-operational' : 'status-error'}\`;
        statusText.textContent = isHealthy ? 'All Systems Operational' : 'System Issues Detected';

        // Convert UTC timestamp to local time
        const utcTime = new Date(data.timestamp);
        const localTime = utcTime.toLocaleString();
        timestamp.textContent = \`Last checked: \${localTime}\`;

        // Update services
        const services = [
            {
                name: 'API Server',
                status: data.status === 'OK' ? 'Operational' : 'Issues',
                healthy: data.status === 'OK'
            },
            {
                name: 'Database',
                status: data.database?.status === 'healthy' ? 'Operational' : 'Issues',
                healthy: data.database?.status === 'healthy'
            },
            {
                name: 'Game Data Sync',
                status: data.backup_file?.exists ? 'Operational' : 'Pending',
                healthy: data.backup_file?.exists !== false
            },
            {
                name: 'Authentication',
                status: 'Operational',
                healthy: true
            }
        ];

        servicesDiv.innerHTML = services.map(service => \`
            <div class="service \${service.healthy ? '' : 'error'}">
                <h3>\${service.name}</h3>
                <div class="service-status">\${service.status}</div>
            </div>
        \`).join('');

        // Update last updated time
        lastUpdated.textContent = new Date().toLocaleString();

    } catch (error) {
        console.error('Error fetching status:', error);
        
        overallStatus.className = 'status-indicator status-error';
        statusText.textContent = 'Unable to Check Status';
        timestamp.textContent = \`Connection failed: \${error.message}\`;
        
        servicesDiv.innerHTML = \`
            <div class="service error">
                <h3>Connection Error</h3>
                <div class="service-status">Unable to reach server: \${error.message}</div>
            </div>
        \`;
    } finally {
        statusCard.classList.remove('loading');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing status page');
    
    // Add event listener for refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            console.log('Refresh button clicked');
            checkStatus();
        });
        console.log('Refresh button event listener added');
    } else {
        console.error('Refresh button not found!');
    }

    // Check status on page load
    console.log('Starting initial status check');
    checkStatus();

    // Auto-refresh every 30 seconds
    console.log('Setting up auto-refresh interval');
    setInterval(checkStatus, 30000);
});

// Fallback: if DOMContentLoaded has already fired
if (document.readyState === 'loading') {
    console.log('DOM still loading, waiting for DOMContentLoaded');
} else {
    console.log('DOM already loaded, initializing immediately');
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            console.log('Refresh button clicked');
            checkStatus();
        });
    }
    checkStatus();
    setInterval(checkStatus, 30000);
}
`;

    res.set('Content-Type', 'application/javascript');
    res.send(statusJS);
});

/**
 * @swagger
 * /gdt/status:
 *   get:
 *     summary: Status Page (HTML)
 *     tags: [Health]
 *     description: Visual status page showing system health with modern UI
 *     responses:
 *       200:
 *         description: HTML status page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
app.get('/gdt/status', (req, res) => {
    const statusPageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gacha Daily Tracker - Status</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 50px;
            color: white;
        }

        .header h1 {
            font-size: 2.5rem;
            font-weight: 300;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .status-card {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
            transition: transform 0.2s ease;
        }

        .status-card:hover {
            transform: translateY(-5px);
        }

        .overall-status {
            text-align: center;
            margin-bottom: 40px;
        }

        .status-indicator {
            display: inline-flex;
            align-items: center;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 1.1rem;
            margin-bottom: 15px;
        }

        .status-operational {
            background: #d4edda;
            color: #155724;
            border: 2px solid #c3e6cb;
        }

        .status-error {
            background: #f8d7da;
            color: #721c24;
            border: 2px solid #f5c6cb;
        }

        .status-indicator::before {
            content: '';
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
        }

        .status-operational::before {
            background: #28a745;
        }

        .status-error::before {
            background: #dc3545;
        }

        .timestamp {
            color: #666;
            font-size: 0.9rem;
        }

        .services {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }

        .service {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
            transition: all 0.2s ease;
        }

        .service:hover {
            background: #e9ecef;
        }

        .service.error {
            border-left-color: #dc3545;
        }

        .service h3 {
            font-size: 1.1rem;
            margin-bottom: 8px;
            color: #333;
        }

        .service-status {
            font-size: 0.9rem;
            font-weight: 600;
            color: #28a745;
        }

        .service.error .service-status {
            color: #dc3545;
        }

        .footer {
            text-align: center;
            color: white;
            opacity: 0.8;
            margin-top: 40px;
        }

        .refresh-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-top: 20px;
            transition: background 0.2s ease;
        }

        .refresh-btn:hover {
            background: #5a6fd8;
        }

        .loading {
            opacity: 0.6;
            pointer-events: none;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .status-card {
                padding: 30px 20px;
            }
            
            .services {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 Gacha Daily Tracker</h1>
            <p>API Status & System Health</p>
        </div>

        <div class="status-card" id="statusCard">
            <div class="overall-status">
                <div class="status-indicator" id="overallStatus">
                    <span id="statusText">Loading...</span>
                </div>
                <div class="timestamp" id="timestamp">Checking system status...</div>
            </div>

            <div class="services" id="services">
                <!-- Services will be populated by JavaScript -->
            </div>

            <div style="text-align: center;">
                <button class="refresh-btn" id="refreshBtn">🔄 Refresh Status</button>
            </div>
        </div>

        <div class="footer">
            <p>Last updated: <span id="lastUpdated">Never</span></p>
            <p>Powered by Heroku • Built with ❤️</p>
        </div>
    </div>
    <script src="/public/status.js"></script>
</body>
</html>`;

    res.send(statusPageHTML);
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
            console.log(`🎮 Games API: http://localhost:${PORT}/gdt/games`);
            console.log(`🌐 Timezones API: http://localhost:${PORT}/gdt/timezones`);
            console.log(`💚 Health check: http://localhost:${PORT}/gdt/health`);
            console.log(`✅ Status: http://localhost:${PORT}/gdt/status`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/gdt/api-docs`);
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