import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

interface GameData {
  game: string;
  server: string;
  timezone: string;
  dailyReset: string;
  icon: string;
}

class GameDataService {
  private sourceUrl: string;
  private fallbackPath: string;
  private lastFetch: Date | null = null;
  private cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    this.sourceUrl = process.env.GAME_DATA_SOURCE_URL || '';
    this.fallbackPath = process.env.GAME_DATA_FALLBACK_PATH || './data/game-data-backup.js';
  }

  /**
   * Get game data with fallback strategy
   * 1. Try to fetch from GitHub (if cache expired)
   * 2. Use local backup if GitHub fails
   * 3. Throw error if both fail
   */
  async getGameData(): Promise<GameData[]> {
    try {
      // Try primary source first
      const data = await this.fetchFromSource();
      if (data && data.length > 0) {
        // Save successful fetch as backup
        await this.saveBackup(data);
        console.log(`✅ Fetched ${data.length} games from primary source`);
        return data;
      }
    } catch (error) {
      console.warn('⚠️ Primary source failed, trying fallback...', error);
    }

    // Fallback to local backup
    try {
      const data = await this.loadFromBackup();
      console.log(`📁 Loaded ${data.length} games from local backup`);
      return data;
    } catch (error) {
      throw new Error('Both primary source and fallback failed: ' + error);
    }
  }

  /**
   * Force refresh from primary source
   */
  async refreshFromSource(): Promise<GameData[]> {
    this.lastFetch = null; // Force refresh
    return await this.getGameData();
  }

  /**
   * Fetch game data from GitHub
   */
  private async fetchFromSource(): Promise<GameData[]> {
    if (!this.shouldFetch()) {
      throw new Error('Cache still valid, skipping fetch');
    }

    const response = await axios.get(this.sourceUrl, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Gacha-Daily-Tracker/1.0'
      }
    });

    // Parse the JavaScript file content
    const gameData = this.parseGameDataFile(response.data);
    this.lastFetch = new Date();

    return gameData;
  }

  /**
   * Parse the game-data.js file content
   */
  private parseGameDataFile(fileContent: string): GameData[] {
    try {
      // First try JSON conversion approach
      const jsonStart = fileContent.indexOf('[');
      const jsonEnd = fileContent.lastIndexOf('];');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          const arrayContent = fileContent.slice(jsonStart, jsonEnd + 1);

          // Convert JS object notation to JSON
          let validJson = arrayContent
              .replace(/\t/g, ' ')
              .replace(/\n\s+/g, '\n  ')
              .replace(/^\s*(\w+):/gm, '  "$1":')
              .replace(/,\s*\n/g, ',\n')
              .replace(/"([^"]+)":/g, '"$1":');

          const gameData = JSON.parse(validJson);

          if (Array.isArray(gameData) && gameData.length > 0) {
            return gameData;
          }
        } catch (jsonError) {
          console.log('JSON parsing failed, trying eval method...');
        }
      }

      // Fallback to eval method (safe for trusted source)
      const evalContent = fileContent.replace('var gameData = ', '').replace(/;\s*$/, '');
      const gameData = eval('(' + evalContent + ')');

      // Validate data structure
      if (!Array.isArray(gameData) || gameData.length === 0) {
        throw new Error('Game data is not a valid array');
      }

      return gameData;
    } catch (error) {
      throw new Error(`Failed to parse game data: ${error}`);
    }
  }

  /**
   * Save game data as local backup
   */
  private async saveBackup(data: GameData[]): Promise<void> {
    try {
      const backupDir = path.dirname(this.fallbackPath);
      await fs.mkdir(backupDir, { recursive: true });

      const backup = {
        lastUpdated: new Date().toISOString(),
        source: this.sourceUrl,
        gameCount: data.length,
        data: data
      };

      await fs.writeFile(
          this.fallbackPath.replace('.js', '.json'),
          JSON.stringify(backup, null, 2)
      );
    } catch (error) {
      console.warn('Failed to save backup:', error);
    }
  }

  /**
   * Load game data from local backup
   */
  private async loadFromBackup(): Promise<GameData[]> {
    try {
      const backupPath = this.fallbackPath.replace('.js', '.json');
      const content = await fs.readFile(backupPath, 'utf-8');
      const backup = JSON.parse(content);

      if (!backup.data || !Array.isArray(backup.data)) {
        throw new Error('Invalid backup format');
      }

      return backup.data;
    } catch (error) {
      throw new Error(`Failed to load backup: ${error}`);
    }
  }

  /**
   * Check if we should fetch new data (cache expired)
   */
  private shouldFetch(): boolean {
    if (!this.lastFetch) return true;
    return (Date.now() - this.lastFetch.getTime()) > this.cacheTimeout;
  }

  /**
   * Get info about current data source
   */
  async getDataInfo() {
    try {
      const data = await this.getGameData();
      return {
        gameCount: data.length,
        lastFetch: this.lastFetch,
        source: this.lastFetch ? 'primary' : 'backup',
        cacheExpires: this.lastFetch ? new Date(this.lastFetch.getTime() + this.cacheTimeout) : null
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Safely access the `message` property if error is an instance of Error
        return { error: error.message };
      } else {
        // In case the error is not an instance of Error, return a generic message
        return { error: 'An unknown error occurred' };
      }
    }
  }
}

export default new GameDataService();