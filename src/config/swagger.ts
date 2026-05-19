import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Gacha Daily Tracker API',
            version: '3.5.0',
            description: `
A REST API for tracking daily reset times across 330+ gacha games.

Never miss your dailies again! Track reset times across multiple servers
and timezones, manage your personal game list, and stay on top of your
daily routine.

## Features
- Real-time reset tracking for 330+ gacha games
- Multi-timezone support via IANA timezone database
- JWT authentication with bcrypt + HMAC pepper
- Anonymous tracking — no account required
- Full OpenAPI 3.0 documentation
`,
            contact: {
                name: 'Gacha Daily Tracker',
                url: 'https://github.com/pmadin/GachaDailyTracker',
            },
            license: {
                name: 'GPL-3.0',
                url: 'https://opensource.org/licenses/GPL-3.0',
            },
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Game: {
                    type: 'object',
                    required: ['id', 'name', 'server', 'timezone', 'daily_reset'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Unique game identifier',
                            example: 126,
                        },
                        name: {
                            type: 'string',
                            description: 'Game name',
                            example: 'Guardian Tales',
                        },
                        server: {
                            type: 'string',
                            description: 'Server region',
                            example: 'Global',
                            enum: ['Global', 'JP', 'KR', 'CN', 'SEA', 'LATAM', 'EU', 'NA'],
                        },
                        timezone: {
                            type: 'string',
                            description: 'Server timezone',
                            example: 'America/Los_Angeles',
                        },
                        daily_reset: {
                            type: 'string',
                            format: 'time',
                            description: 'Daily reset time (24h format)',
                            example: '08:00',
                        },
                        icon_name: {
                            type: 'string',
                            description: 'Icon identifier for the game',
                            example: 'guardian-tales',
                        },
                        last_verified: {
                            type: 'string',
                            format: 'date-time',
                            description: 'When the data was last verified',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    required: ['error'],
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message',
                            example: 'Game not found',
                        },
                    },
                },
                GameList: {
                    type: 'object',
                    required: ['games', 'total'],
                    properties: {
                        games: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Game',
                            },
                        },
                        total: {
                            type: 'integer',
                            description: 'Total number of games available',
                            example: 303,
                        },
                        limit: {
                            type: 'integer',
                            description: 'Number of results per page',
                            example: 50,
                        },
                        offset: {
                            type: 'integer',
                            description: 'Offset for pagination',
                            example: 0,
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Games',
                description: '🎮 Game management and data retrieval',
            },
            {
                name: 'Authentication',
                description: '🔐 User registration and login',
            },
            {
                name: 'Game Management',
                description: '🔒 Game data editing',
            },
            {
                name: 'Health',
                description: '💚 System health and status checks',
            },
            {
                name: 'Notifications',
                description: '🔔 Push notification subscriptions and preferences',
            },
            {
                name: 'Admin',
                description: '🛡️ Game management, imports, and icon uploads (role 3+)',
            },
            {
                name: 'Leaderboard',
                description: '🏆 Public streak leaderboard (toggleable by admin)',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/routes/**/*.ts', './src/index.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

// Custom CSS for gacha/anime theming
const customCss = `
  .swagger-ui .topbar { 
    background: linear-gradient(135deg, #8a6020 0%, #c8913c 100%);
    border-bottom: 2px solid rgba(200,155,60,0.5);
  }
  .swagger-ui .topbar .download-url-wrapper { display: none; }
  
  .swagger-ui .info .title {
    color: #2d3748 !important;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-weight: 700;
  }
  
  .swagger-ui .info .description {
    color: #2d3748 !important;
    font-size: 14px;
    line-height: 1.6;
  }
  
  /* Comprehensive fix for ALL purple text including description */
  .swagger-ui .info .description p,
  .swagger-ui .info .description div,
  .swagger-ui .info .description,
  .swagger-ui .info .description *,
  .swagger-ui .info .description .markdown,
  .swagger-ui .info .description .markdown *,
  .swagger-ui .info .description .renderedMarkdown,
  .swagger-ui .info .description .renderedMarkdown *,
  .swagger-ui .renderedMarkdown p,
  .swagger-ui .renderedMarkdown div,
  .swagger-ui .renderedMarkdown,
  .swagger-ui .renderedMarkdown *,
  .swagger-ui .description,
  .swagger-ui .description *,
  .swagger-ui .parameter__name,
  .swagger-ui .parameter__type,
  .swagger-ui .response-col_description .markdown p,
  .swagger-ui .response-col_description .markdown div,
  .swagger-ui .response-col_description .markdown *,
  .swagger-ui .opblock .opblock-summary-description,
  .swagger-ui .opblock-description-wrapper p,
  .swagger-ui .opblock-description-wrapper div,
  .swagger-ui .opblock-description-wrapper *,
  .swagger-ui .markdown p,
  .swagger-ui .markdown div,
  .swagger-ui .markdown,
  .swagger-ui .markdown *,
  .swagger-ui .markdown h1,
  .swagger-ui .markdown h2,
  .swagger-ui .markdown h3,
  .swagger-ui .markdown h4,
  .swagger-ui .markdown h5,
  .swagger-ui .markdown h6,
  .swagger-ui .markdown ul,
  .swagger-ui .markdown ol,
  .swagger-ui .markdown li {
    color: #2d3748 !important;
  }
  
  /* Specific fix for info section markdown content */
  .swagger-ui .info .description .markdown,
  .swagger-ui .info .description .markdown p,
  .swagger-ui .info .description .markdown div,
  .swagger-ui .info .description .markdown ul,
  .swagger-ui .info .description .markdown li,
  .swagger-ui .info .description .markdown h1,
  .swagger-ui .info .description .markdown h2,
  .swagger-ui .info .description .markdown h3 {
    color: #2d3748 !important;
  }
  
  .swagger-ui .scheme-container {
    background: linear-gradient(135deg, #8a6020 0%, #c8913c 100%);
    border-radius: 8px;
    padding: 10px;
    margin: 20px 0;
  }

  .swagger-ui .scheme-container .schemes > label,
  .swagger-ui .scheme-container .schemes-title {
    color: #1a0c04 !important;
    font-weight: 600;
  }

  .swagger-ui .btn.authorize,
  .swagger-ui .btn.authorize svg {
    color: #1a0c04 !important;
    border-color: rgba(26,12,4,0.5) !important;
    fill: #1a0c04 !important;
  }

  .swagger-ui .btn.authorize:hover {
    background: rgba(26,12,4,0.1) !important;
  }
  
  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #38a169;
  }
  
  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #3182ce;
  }
  
  .swagger-ui .opblock.opblock-put .opblock-summary-method {
    background: #d69e2e;
  }
  
  .swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background: #e53e3e;
  }
  
  .swagger-ui .opblock .opblock-summary-path {
    font-family: 'Monaco', 'Consolas', monospace;
    font-weight: 600;
    color: #2d3748 !important;
  }
  
  .swagger-ui .btn.execute {
    background: linear-gradient(135deg, #c8913c 0%, #e8c86a 100%);
    border: none;
    border-radius: 6px;
    color: #0a0808;
    font-weight: 600;
  }

  .swagger-ui .btn.execute:hover {
    background: linear-gradient(135deg, #b07828 0%, #d4a030 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(200,145,60,0.4);
  }
  
  .swagger-ui .response-col_description__inner div.markdown,
  .swagger-ui .response-col_description__inner div.renderedMarkdown {
    background: #f7fafc;
    border-left: 4px solid #c8913c;
    padding: 10px 15px;
    border-radius: 4px;
  }
  
  /* JSON response body font styling */
  .swagger-ui .response-col_description .microlight,
  .swagger-ui .response-col_description pre,
  .swagger-ui .response-col_description code,
  .swagger-ui .highlight-code,
  .swagger-ui .microlight,
  .swagger-ui pre,
  .swagger-ui code,
  .swagger-ui .response-col_description .microlight code,
  .swagger-ui .response-col_description .microlight pre {
    font-family: 'JetBrains Mono', 'Consolas', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
    font-size: 13px !important;
    line-height: 1.4 !important;
    font-weight: 400 !important;
  }
  
  /* Also apply to request body examples */
  .swagger-ui .request-col .microlight,
  .swagger-ui .request-col pre,
  .swagger-ui .request-col code {
    font-family: 'JetBrains Mono', 'Consolas', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
    font-size: 13px !important;
    line-height: 1.4 !important;
  }

  .swagger-ui .opblock-tag {
    border-bottom: 2px solid #c8913c;
    color: #2d3748 !important;
    font-weight: 700 !important;
  }
  
  /* Add sparkle effects */
  .swagger-ui .info .title::after {
    content: '✨';
    margin-left: 10px;
  }
`;

const swaggerOptions = {
    customCss,
    customSiteTitle: 'Gacha Daily Tracker API',
    customfavIcon: '/public/images/favicon.svg',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
        showExtensions: true,
        showCommonExtensions: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        validatorUrl: null, // Disable schema validation
    },
    customHead: `
        <link rel="icon" type="image/svg+xml" href="/public/images/favicon.svg">
        <link rel="icon" type="image/png" sizes="96x96" href="/public/images/favicon-96x96.png">
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <link rel="apple-touch-icon" sizes="180x180" href="/public/images/apple-touch-icon.png">
        <link rel="manifest" href="/site.webmanifest">
        <meta name="msapplication-TileColor" content="#c8913c">
        <meta name="theme-color" content="#c8913c">
        
        <script>
            // Clean up any remaining server selector elements after load
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    // Remove any server selector elements that might still appear
                    const servers = document.querySelectorAll('.servers, .servers-title, [class*="server"]');
                    servers.forEach(el => {
                        if (el.textContent && el.textContent.includes('Server')) {
                            el.style.display = 'none';
                        }
                    });
                }, 500);
            });
        </script>
    `,
};

export { specs, swaggerUi, swaggerOptions };