# Gacha Daily Tracker - Project Summary

## Overview

**Gacha Daily Tracker** is a REST API designed to help gacha game players track and manage their daily tasks across multiple games with smart notifications and reset time management. The application supports 300+ gacha games with comprehensive timezone-aware tracking.

**Status:** In active development (Private repository, planned for public release)

---

## What It Does

The API provides the following core features:

- **Multi-game support** across 300+ gacha titles
- **Server-specific reset time tracking** (Global, JP, KR, CN, SEA, LATAM, EU, NA)
- **Timezone-aware daily task reminders**
- **Smart notification system** with customizable follow-up intervals
- **User authentication** with JWT and role-based access control
- **Game data management** with soft-delete functionality
- **Real-time system health monitoring**

---

## Tech Stack

### Backend
- **Runtime:** Node.js (v18.0.0+)
- **Framework:** Express.js 4.18.2
- **Language:** TypeScript 5.1.6 (compiled to ES2020)
- **Authentication:** JWT (jsonwebtoken 9.0.2) with bcrypt password hashing

### Database
- **DBMS:** PostgreSQL 8.11.3
- **Connection:** pg driver with connection pooling
- **Schema:** Relational model with 6 tables
  - `users` - User accounts and profiles
  - `games` - Game information and reset times
  - `user_games` - User's tracked games (join table)
  - `daily_completions` - Activity log
  - `reminder_settings` - User notification preferences
  - `game_updates` - Audit trail for game modifications
- **Deployment:** Docker Compose for local development

### API Documentation & Security
- **API Docs:** Swagger/OpenAPI 3.0 with swagger-jsdoc 6.2.8
- **UI:** Swagger-UI-Express 5.0.0 (custom themed)
- **Security:** Helmet 7.0.0 (CSP, XSS protection)
- **Validation:** validator 13.15.15
- **CORS:** Enabled with cors middleware

### Development Tools
- **Transpiler:** ts-node 10.9.1
- **Dev Server:** nodemon 3.0.1
- **Package Manager:** npm 8.0.0+
- **HTTP Client:** axios 1.5.0 (for fetching game data)

### Deployment
- **Target:** Heroku
- **Environment:** Supports development, local, and production configurations

---

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Games
- `GET /gdt/games` - Get all games with advanced filtering & pagination
  - Query params: `includeDeleted`, `deletedOnly`, `name`, `search`, `server`, `timezone`, `reset_time`, `icon`, `limit` (1-100, default 50), `offset`, `sort_by`, `order`
- `GET /gdt/games/servers/list` - Get all server regions with game counts
- `GET /gdt/games/:id` - Get specific game by ID
- `GET /gdt/games/deleted` - Get soft-deleted games (for restoration)

#### Utilities
- `GET /gdt/timezones` - Get all supported timezones grouped by region
- `GET /gdt/timezones/detect` - Auto-detect user timezone from headers/IP
- `GET /gdt/health` - API and database health check
- `GET /gdt/status` - Visual HTML status page
- `GET /gdt/` - API home page with docs links
- `GET /` - Redirect to API docs

### Authentication Endpoints

- `POST /gdt/auth/register` - Register new user
  - Body: `username`, `email`, `password`, `confirmPassword`, `registrationToken`
  - Optional: `timezone`, `first_name`, `last_name`, `phone`
- `POST /gdt/auth/login` - Login with email/password
  - Body: `email`, `password`
  - Returns: JWT token (30-day expiry), user info
- `PUT /gdt/auth/profile` - Update user profile (requires JWT)
  - Body: `timezone`, `first_name`, `last_name`, `phone`
- `PATCH /gdt/auth/update-password` - Change password (requires JWT)
  - Body: `identifier`, `currentPassword`, `newPassword`, `confirmNewPassword`
- `PATCH /gdt/auth/update-email` - Change email address (requires JWT)
  - Body: `identifier`, `password`, `newEmail`, `confirmNewEmail`
- `DELETE /gdt/auth/account` - Delete user account (requires JWT, irreversible)
  - Body: `password`, `identifier`

### Game Management Endpoints (Authentication Required)

All endpoints require Bearer token: `Authorization: Bearer <JWT_TOKEN>`

- `PATCH /gdt/update/games/:id` - Update game info
  - Body: `daily_reset` (HH:MM), `timezone`, `is_active`, `reason`
- `POST /gdt/update/add/game` - Add new game to database
  - Body: `name`, `server`, `timezone`, `daily_reset`, `icon_name` (optional)
- `DELETE /gdt/update/delete/game/:id` - Soft-delete a game
  - Body: `reason` (optional)
- `POST /gdt/update/games/import` - Import games from data source

### Admin Endpoints (Admin/Owner Role Required)

Requires admin role (3) or owner role (4) with JWT authentication.

- `PATCH /gdt/admin/users/role/:username` - Update user role
  - Body: `newRole` (1-4), `reason`
- `GET /gdt/admin/users` - List all users (paginated)
- `GET /gdt/admin/users/search` - Search users by criteria

**Role System:**
- 1 = User (default)
- 2 = Premium User
- 3 = Admin
- 4 = Owner

---

## Database Schema

### users Table
```sql
id (SERIAL PRIMARY KEY)
username (VARCHAR 50, UNIQUE, NOT NULL)
email (VARCHAR 255, UNIQUE, NOT NULL)
password_hash (VARCHAR 255, NOT NULL)
timezone (VARCHAR 50, DEFAULT: 'America/Los_Angeles')
first_name (VARCHAR 100, NULLABLE)
last_name (VARCHAR 100, NULLABLE)
phone (VARCHAR 20, NULLABLE)
role (INTEGER, DEFAULT: 1)
created_at (TIMESTAMP, DEFAULT: CURRENT_TIMESTAMP)
updated_at (TIMESTAMP, DEFAULT: CURRENT_TIMESTAMP)
```

### games Table
```sql
id (SERIAL PRIMARY KEY)
name (VARCHAR 255, NOT NULL)
server (VARCHAR 100, NOT NULL)
timezone (VARCHAR 50, NOT NULL)
daily_reset (TIME, NOT NULL)
icon_name (VARCHAR 100, NULLABLE)
source (VARCHAR 50, DEFAULT: 'game-time-master')
is_active (BOOLEAN, DEFAULT: true)
last_verified (TIMESTAMP, DEFAULT: CURRENT_TIMESTAMP)
created_at (TIMESTAMP, DEFAULT: CURRENT_TIMESTAMP)
UNIQUE(name, server)
```

### user_games Table
```sql
id (SERIAL PRIMARY KEY)
user_id (INTEGER, FK → users, ON DELETE CASCADE)
game_id (INTEGER, FK → games, ON DELETE CASCADE)
custom_reminder_offset (INTEGER, DEFAULT: 0)
is_enabled (BOOLEAN, DEFAULT: true)
created_at (TIMESTAMP, DEFAULT: CURRENT_TIMESTAMP)
UNIQUE(user_id, game_id)
```

### daily_completions Table
```sql
id (SERIAL PRIMARY KEY)
user_id (INTEGER, FK → users, ON DELETE CASCADE)
game_id (INTEGER, FK → games, ON DELETE CASCADE)
completion_date (DATE, NOT NULL)
completed_at (TIMESTAMP, DEFAULT: CURRENT_TIMESTAMP)
UNIQUE(user_id, game_id, completion_date)
```

### reminder_settings Table
```sql
id (SERIAL PRIMARY KEY)
user_id (INTEGER, FK → users, ON DELETE CASCADE)
reminder_type (VARCHAR 50, NOT NULL)
is_enabled (BOOLEAN, DEFAULT: true)
reminder_time (TIME, NULLABLE)
created_at (TIMESTAMP, DEFAULT: CURRENT_TIMESTAMP)
```

**Indexes:**
- `idx_user_games_user_id` on user_games(user_id)
- `idx_daily_completions_user_date` on daily_completions(user_id, completion_date)
- `idx_games_active` on games(is_active) WHERE is_active = true
- `idx_users_role` on users(role)

---

## Security Features

### Password Security
- bcrypt with 16 salt rounds (industry standard)
- HMAC-SHA256 pepper for additional layer
- Password pepper stored in environment variables

### JWT Authentication
- 30-day token expiration
- Role embedded in token with database verification
- Token validation on every protected endpoint

### Admin Protection
- Double-check: JWT role vs. database role (prevents privilege escalation)
- Owner-only operations protected (e.g., promoting to admin)
- Audit logging for role changes

### Helmet.js CSP
- Restricts script origins
- Prevents XSS attacks
- Allows unsafe-inline for styles/scripts (Swagger UI requirement)

### Data Validation
- Input sanitization with `validator` library
- Email validation (RFC standards)
- Username pattern: alphanumeric + underscore/hyphen
- Time format validation: HH:MM (24-hour)
- Timezone validation against IANA database
- Pagination limits enforced (1-100 games per request)

---

## Testing State

### Current Status

**Testing Gaps:**
- ❌ No automated unit tests (Jest configured in package.json but no test files)
- ❌ No integration tests configured
- ❌ No test coverage metrics generated
- ✅ Manual Postman testing only for validation

### Available Test Collections

Located in `/test/postman/`:
1. `Gacha-daily-tracker.postman_collection.json` - Main API collection
2. `Local-gacha-daily-tracker.postman_environment.json` - Local environment variables
3. `Gacha Daily Tracker Remote.postman_environment.json` - Remote/Heroku environment
4. `Test Gacha Daily Auth Routes.postman_collection.json` - Authentication testing
5. `Test Gacha Daily Closed Routes.postman_collection.json` - Admin/game management testing
6. `Test-Gacha-daily-tracker (games files open).postman_collection.json` - Game data testing

### Recommendations

**Automated Testing Implementation:**
```bash
# Unit tests with Jest
npm install --save-dev jest @types/jest ts-jest

# Integration tests with Supertest
npm install --save-dev supertest @types/supertest

# Test coverage reporting
npm test -- --coverage
```

**Suggested Test Structure:**
```
test/
├── unit/
│   ├── services/
│   ├── middleware/
│   └── utils/
├── integration/
│   ├── auth.test.ts
│   ├── games.test.ts
│   └── admin.test.ts
└── postman/
```

---

## Project Structure

```
gacha_tracker/
├── src/
│   ├── config/
│   │   ├── database.ts          # PostgreSQL connection pool
│   │   └── swagger.ts           # Swagger/OpenAPI configuration
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification & token parsing
│   │   └── admin.ts             # Admin/owner role checking
│   ├── routes/
│   │   ├── games.ts             # Public game endpoints
│   │   ├── timezone.ts          # Timezone utilities
│   │   ├── auth/
│   │   │   ├── index.ts         # Route aggregator
│   │   │   ├── register.ts      # User registration
│   │   │   ├── login.ts         # User login
│   │   │   ├── profile.ts       # Profile updates
│   │   │   ├── passwordUpdate.ts # Password change
│   │   │   ├── emailUpdate.ts   # Email change
│   │   │   └── delete.ts        # Account deletion
│   │   └── closed/
│   │       ├── roles.ts         # Admin role management
│   │       └── close.ts         # Game management endpoints
│   ├── services/
│   │   ├── gameDataService.ts   # Fetch/parse game data from GitHub
│   │   ├── timezoneService.ts   # Timezone validation & detection
│   │   └── autoImportService.ts # Auto-sync game data on startup
│   ├── public/
│   │   ├── gameInfo.js          # Frontend helper script
│   │   ├── status.js            # Status page JavaScript
│   │   └── images/              # Favicon, PWA icons
│   └── index.ts                 # Main Express app, routes setup
├── database/
│   └── init/
│       └── 01-schema.sql        # PostgreSQL schema definition
├── test/
│   └── postman/                 # Postman collections for manual testing
├── docs/
│   └── frontend-timezone-helper.js # Client-side timezone detection
├── scripts/
│   ├── download-game-data.js   # Fetch game data from GitHub
│   └── convert-json-to-csv.js  # Data export utility
├── package.json                # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── docker-compose.yml         # PostgreSQL container setup
└── .env / .env.development    # Environment variables
```

---

## Key Features & Architectural Decisions

### Game Management Features
1. **Soft-Delete Pattern**: Games marked inactive (`is_active = false`) rather than hard-deleted
2. **Audit Trail**: All game updates logged with reason, user, and timestamp
3. **Game Data Source**: Fetches from GitHub (cicerakes/Game-Time-Master) with fallback to local backup
4. **Auto-Import**: Loads game data on server startup if missing

### Error Handling
- Consistent error response format
- Meaningful error messages with hints
- Database connection error recovery
- Graceful fallback to local data if remote fetch fails

---

## Environment Variables

```bash
NODE_ENV=development|production
PORT=4000 (default)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<secret-key>
PASSWORD_PEPPER=<pepper-value>
REGISTRATION_TOKEN=<token-for-registration>
GAME_DATA_SOURCE_URL=https://raw.githubusercontent.com/.../game-data.js
GAME_DATA_FALLBACK_PATH=./data/game-data-backup.js
```

---

## Build & Development Commands

```bash
# Setup
npm install              # Install dependencies
npm run setup           # Download game data + start Docker

# Development
npm run dev             # Development server with .env.development
npm run prod            # Production server with .env.production

# Build & Start
npm run build           # Compile TypeScript to dist/
npm start               # Production: NODE_PATH=./dist node dist/index.js

# Database
npm run db-reset        # Restart PostgreSQL container

# Deployment
npm run deploy          # Git push to Heroku main branch

# Code Quality
npm run format:check    # Prettier validation
npm run format:write    # Auto-format code
npm run lint            # ESLint validation
npm test                # Run tests (currently unconfigured)
```

---

## Deployment

### Heroku Configuration
- Configured for Heroku deployment
- Uses PostgreSQL add-on (environment variable `DATABASE_URL`)
- Postinstall script compiles TypeScript automatically
- Static files served from `dist/public` or `src/public`

### Docker Setup
```bash
docker-compose up -d    # Start PostgreSQL container
docker-compose down     # Stop containers
```

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Project Type** | REST API (Node.js/Express) |
| **Language** | TypeScript (ES2020 target) |
| **Framework** | Express.js 4.18.2 |
| **Database** | PostgreSQL (6 tables) |
| **Authentication** | JWT + bcrypt + pepper |
| **API Docs** | OpenAPI 3.0 / Swagger UI |
| **Total Games** | 300+ across 8 server regions |
| **Public Endpoints** | 7 (Games, Timezones, Health) |
| **Auth Endpoints** | 6 (Register, Login, Profile, Password, Email, Delete) |
| **Admin Endpoints** | 3 (Roles, User List, Search) |
| **Game Mgmt** | 4 (Update, Add, Delete, Import) |
| **Test Coverage** | Postman collections only (no Jest) |
| **Status** | In active development |
| **Deployment** | Heroku-ready |

---

## Next Steps

### Recommended Improvements
1. **Implement automated testing** (Jest unit tests, Supertest integration tests)
2. **Add test coverage reporting** to track code quality
3. **Set up CI/CD pipeline** for automated testing and deployment
4. **Create API rate limiting** to prevent abuse
5. **Add request logging** (Morgan or similar)
6. **Implement caching layer** (Redis) for frequently accessed game data
7. **Add WebSocket support** for real-time notifications
8. **Create frontend client** to consume the API

---

**Last Updated:** 2025-11-12
**Branch:** dev
**License:** Private (planned for public release)
