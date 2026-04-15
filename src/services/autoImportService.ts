import fs from 'fs/promises';
import path from 'path';
import database from '../config/database';

interface GameDataBackup {
    lastUpdated: string;
    source: string;
    gameCount: number;
    data: Array<{
        game: string;
        server: string;
        timezone: string;
        dailyReset: string;
        icon: string;
    }>;
}

class AutoImportService {
    private backupPath = path.join(process.cwd(), 'data', 'game-data-backup.json');

    /**
     * Check if database needs initial data and import from local backup
     */
    async checkAndImportInitialData(): Promise<void> {
        try {
            // Check if games table has data
            const result = await database.query('SELECT COUNT(*) FROM games WHERE is_active = true');
            const gameCount = parseInt(result.rows[0].count);

            if (gameCount > 0) {
                console.log(`✅ Database already has ${gameCount} games. Skipping auto-import.`);
                return;
            }

            console.log('📊 Database is empty. Loading initial game data...');

            // Try to load from local backup
            const imported = await this.importFromLocalBackup();

            if (imported > 0) {
                console.log(`✅ Successfully auto-imported ${imported} games from local backup!`);
                console.log('💡 Use POST /api/games/import to refresh with latest data from GitHub.');
            } else {
                console.log('⚠️  No local backup found. Use POST /api/games/import to download initial data.');
            }

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Auto-import failed:', errorMessage);
            console.log('💡 You can manually import data using: POST /api/games/import');
        }
    }

    /**
     * Import games from local JSON backup file
     */
    private async importFromLocalBackup(): Promise<number> {
        try {
            // Check if backup file exists
            const backupContent = await fs.readFile(this.backupPath, 'utf-8');
            const backup: GameDataBackup = JSON.parse(backupContent);

            if (!backup.data || !Array.isArray(backup.data)) {
                throw new Error('Invalid backup file format');
            }

            console.log(`📁 Found local backup with ${backup.data.length} games from ${backup.lastUpdated}`);

            let imported = 0;
            let errors = 0;

            // Import each game
            for (const game of backup.data) {
                try {
                    await database.query(`
            INSERT INTO games (name, server, timezone, daily_reset, icon_name, source, last_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (name, server) DO NOTHING
          `, [
                        game.game,
                        game.server,
                        game.timezone,
                        game.dailyReset,
                        game.icon,
                        'game-time-master',
                        backup.lastUpdated
                    ]);

                    imported++;

                    // Log progress every 50 games
                    if (imported % 50 === 0) {
                        console.log(`📥 Imported ${imported}/${backup.data.length} games...`);
                    }

                } catch (gameError: unknown) {
                    errors++;
                    const errorMsg = gameError instanceof Error ? gameError.message : 'Unknown error';
                    console.warn(`⚠️  Failed to import ${game.game} (${game.server}): ${errorMsg}`);
                }
            }

            if (errors > 0) {
                console.log(`⚠️  Import completed with ${errors} errors. Successfully imported: ${imported} games.`);
            }

            return imported;

        } catch (error: unknown) {
            if (error instanceof Error && error.message.includes('ENOENT')) {
                console.log('📄 No local backup file found. Run "npm run download-game-data" first.');
                return 0;
            }
            throw error;
        }
    }

    /**
     * Get backup file info
     */
    async getBackupInfo(): Promise<any> {
        try {
            const backupContent = await fs.readFile(this.backupPath, 'utf-8');
            const backup: GameDataBackup = JSON.parse(backupContent);

            return {
                exists: true,
                lastUpdated: backup.lastUpdated,
                source: backup.source,
                gameCount: backup.gameCount,
                filePath: this.backupPath
            };
        } catch (error: unknown) {
            return {
                exists: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                filePath: this.backupPath
            };
        }
    }
}

export default new AutoImportService();