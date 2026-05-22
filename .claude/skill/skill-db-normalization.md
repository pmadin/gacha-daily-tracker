# Claude Skill — Database Normalization & Optimization
# Save as: /mnt/skills/user/db-normalization/SKILL.md
# Add path to .gitignore — do not commit this skill file to the dev branch

## Skill Overview

Use this skill when asked to audit, normalize, or optimize a PostgreSQL database
schema. It covers 3NF normalization analysis, dead column detection, index
recommendations, and safe migration generation.

Trigger phrases:
- "normalize the database"
- "audit the schema"
- "find dead columns"
- "optimize the DB"
- "check for 3NF violations"
- "generate a migration"
- "what indexes are missing"

---

## What This Skill Does

Given a PostgreSQL schema (as a `CREATE TABLE` dump, a description, or query results),
this skill will:

1. **Identify 3NF violations** — partial and transitive dependencies
2. **Find dead columns** — columns that are never queried, always null, or not used
   in any application route
3. **Recommend safe migrations** — `ALTER TABLE` statements with rollback options
4. **Suggest missing indexes** — based on common query patterns (foreign keys,
   frequently filtered columns, ORDER BY columns)
5. **Flag privacy risks** — PII columns (name, email, phone, address) that aren't
   needed for application features

---

## Step-by-Step Process

### Step 1 — Gather the Schema

Ask the user to provide one of:
- Output of `\d tablename` from psql
- The `CREATE TABLE` statements from their schema file
- Output of `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'x'`

If the user hasn't provided the schema yet, ask:
```
"Please share your schema — either the CREATE TABLE statements or the output
of \d tablename from psql for each table you want audited."
```

### Step 2 — Run the Audit Queries

Provide these queries for the user to run on their DB:

```sql
-- 1. All columns across all tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2. All existing indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 3. Foreign key relationships
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name  AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- 4. Row counts (helps prioritize what matters)
SELECT
  relname AS table_name,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- 5. Check for columns that are always NULL
-- Run per table, e.g. for users:
SELECT
  COUNT(*) AS total_rows,
  COUNT(first_name) AS first_name_non_null,
  COUNT(last_name) AS last_name_non_null,
  COUNT(phone) AS phone_non_null
FROM users;
```

### Step 3 — Analyze for 3NF Violations

**First Normal Form (1NF)** — check for:
- Array columns storing multiple values (e.g. `days_of_week SMALLINT[]`)
  → Note: arrays are acceptable in PostgreSQL when the data is truly atomic
    per element and not queried individually. Flag but don't auto-recommend removal.
- Comma-separated values stored as TEXT → always flag, recommend junction table

**Second Normal Form (2NF)** — check for partial dependencies:
- Only applies to tables with composite primary keys
- Look for columns that depend on only part of the composite key
- Recommend splitting into separate tables

**Third Normal Form (3NF)** — check for transitive dependencies:
- A non-key column that depends on another non-key column
- Classic example: `users` table storing `city` and `country` — city depends on
  a zip code column, not directly on user_id
- Recommend extracting to a lookup table only if the data changes independently

**When NOT to normalize to 3NF:**
- Lookup/reference data that never changes (e.g. `role` stored as integer +
  a separate `role_name` derived in application code) — denormalization is fine
- Performance-critical read paths where JOINs would be expensive
- Small tables where the JOIN cost exceeds the normalization benefit
- Always note the tradeoff when recommending a 3NF fix

### Step 4 — Dead Column Detection

Flag a column as potentially dead if:
- It is always NULL (from Step 2 query 5)
- The column name suggests unused PII: `first_name`, `last_name`, `phone`,
  `address`, `date_of_birth` — ask if these are used in any feature
- The column has a default value and no application logic ever changes it
- The column is `is_enabled`, `is_visible`, `is_deleted` style flags where
  the boolean is always the same value

Output format:
```
Dead Column Candidates:
─────────────────────
Table: users
  • first_name (VARCHAR) — always NULL in 100% of rows, not used in any API response
  • last_name  (VARCHAR) — same
  • phone      (VARCHAR) — same, also a privacy liability

Recommendation:
  ALTER TABLE users DROP COLUMN first_name, last_name, phone;
  
  Rollback (if needed):
  ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
  ALTER TABLE users ADD COLUMN last_name  VARCHAR(100);
  ALTER TABLE users ADD COLUMN phone      VARCHAR(20);
```

### Step 5 — Index Recommendations

Check for:

**Missing foreign key indexes:**
```sql
-- Foreign keys that don't have a supporting index
SELECT
  tc.table_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND NOT EXISTS (
    SELECT 1 FROM pg_indexes pi
    WHERE pi.tablename = tc.table_name
      AND pi.indexdef LIKE '%(' || kcu.column_name || ')%'
  );
```

**Common patterns to index:**
- Any column used in `WHERE column = $1` on a large table
- Any column used in `ORDER BY column DESC` on a leaderboard or feed query
- Composite indexes for frequent multi-column filters
- Partial indexes for filtered queries (e.g. `WHERE is_active = true`)

Output format:
```
Missing Index Recommendations:
──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_games_user_id 
  ON user_games(user_id);
  -- Reason: foreign key, used in every tracker query

CREATE INDEX IF NOT EXISTS idx_users_streak 
  ON users(streak_count DESC) WHERE streak_count > 0;
  -- Reason: leaderboard ORDER BY query, partial index skips 0-streak users
```

### Step 6 — Generate the Migration File

Output a complete, safe migration script:

```sql
-- Migration: [description]
-- Generated: [date]
-- Target: PostgreSQL on Heroku
-- Safe to run on live DB: YES / NO (note if table locks are expected)

BEGIN;

-- 1. Drop dead columns
ALTER TABLE users 
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name,
  DROP COLUMN IF EXISTS phone;

-- 2. Add missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_games_user_id 
  ON user_games(user_id);
-- Note: CONCURRENTLY avoids table lock, safe on live DB

-- 3. [Any other changes]

COMMIT;

-- Verification queries (run after migration):
SELECT COUNT(*) FROM users; -- Should match pre-migration count
\d users                    -- Confirm dropped columns are gone
\d user_games               -- Confirm new index appears
```

**Always use `IF EXISTS` / `IF NOT EXISTS`** — makes migrations idempotent
(safe to run twice without errors).

**Use `CREATE INDEX CONCURRENTLY`** for large tables — avoids locking the table
during index creation on a live database.

---

## Output Format

Always structure the audit output as:

```
## Schema Audit Report
Generated for: [project name]
Tables analyzed: [N]

### 🔴 Issues (fix these)
[Critical violations — data integrity, privacy risks]

### 🟡 Recommendations (consider these)
[3NF violations worth fixing, missing indexes]

### 🟢 Looks Good
[Tables/columns that are clean]

### 📋 Generated Migration
[Complete SQL ready to run]

### ✅ Verification Queries
[Run these after the migration to confirm]
```

---

## GachaDailyTracker-Specific Notes

This skill was created for and first applied to the GachaDailyTracker project.
Known schema decisions that are intentional (not violations):

- `play_schedules.days_of_week SMALLINT[]` — array type is intentional,
  each element is atomic (a day number 0–6), queried with `= ANY()`
- `games.source VARCHAR` — denormalized intentionally, only ever one value
  (`'game-time-master'`), not worth a lookup table at this scale
- `users.role INTEGER` — role name derived in application layer, not stored
  as a foreign key to a roles table — acceptable for a small project
- `site_settings (key, value)` — EAV pattern, intentional for flexible
  admin toggles without schema changes

---

## When to Recommend BCNF vs Stopping at 3NF

**Stop at 3NF when:**
- The table is small (< 100k rows)
- The BCNF fix would require splitting a table that is queried together 99% of the time
- The anomaly being fixed by BCNF would never occur in practice given application constraints

**Consider BCNF when:**
- Multiple overlapping candidate keys exist and one determines the other
- Data anomalies (insert/update/delete) are actually occurring in practice
- The table is large and the JOIN cost of 3NF is already acceptable

For most side projects and early-stage apps, 3NF is the right stopping point.
