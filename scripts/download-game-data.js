const https = require('https');
const fs = require('fs');
const path = require('path');

const sourceUrl = 'https://raw.githubusercontent.com/cicerakes/Game-Time-Master/refs/heads/master/game-data.js';
const dataDir = path.join(__dirname, '../data');
const backupPath = path.join(dataDir, 'game-data-backup.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

console.log('📥 Downloading game data backup...');

https.get(sourceUrl, (response) => {
    let data = '';

    response.on('data', (chunk) => {
        data += chunk;
    });

    response.on('end', () => {
        try {
            // Parse the JavaScript file content
            const jsonStart = data.indexOf('[');
            const jsonEnd = data.lastIndexOf('];');

            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('Invalid game data format - could not find array boundaries');
            }

            // Extract just the array content (without the closing ];)
            const arrayContent = data.slice(jsonStart, jsonEnd + 1);

            console.log('📝 Processing JavaScript object notation...');

            // More robust conversion from JS object notation to JSON
            let validJson = arrayContent
                // Remove tabs and extra whitespace
                .replace(/\t/g, ' ')
                .replace(/\n\s+/g, '\n  ')
                // Quote property names (handle word characters followed by colon)
                .replace(/^\s*(\w+):/gm, '  "$1":')
                // Ensure proper spacing
                .replace(/,\s*\n/g, ',\n')
                // Clean up any malformed quotes
                .replace(/"([^"]+)":/g, '"$1":');

            console.log('🔍 Sample of converted JSON:', validJson.slice(0, 300));

            const gameData = JSON.parse(validJson);

            // Validate data structure
            if (!Array.isArray(gameData) || gameData.length === 0) {
                throw new Error('Game data is not a valid array');
            }

            // Create backup with metadata
            const backup = {
                lastUpdated: new Date().toISOString(),
                source: sourceUrl,
                gameCount: gameData.length,
                data: gameData
            };

            // Save backup
            fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

            console.log(`✅ Successfully downloaded ${gameData.length} games`);
            console.log(`💾 Backup saved to: ${backupPath}`);

            // Show sample games
            console.log('\n📋 Sample games:');
            gameData.slice(0, 5).forEach(game => {
                console.log(`  • ${game.game} (${game.server}) - Reset: ${game.dailyReset} ${game.timezone}`);
            });

        } catch (error) {
            console.error('❌ Failed to process game data:', error.message);
            console.error('\n🔍 Raw content preview:');
            console.error(data.slice(0, 500));

            // Use eval in a safe way
            console.log('\n🔄 Trying alternative parsing method...');
            try {
                // Create a safe evaluation context
                const evalContent = data.replace('var gameData = ', '').replace(/;\s*$/, '');
                const gameData = eval('(' + evalContent + ')');

                if (Array.isArray(gameData) && gameData.length > 0) {
                    const backup = {
                        lastUpdated: new Date().toISOString(),
                        source: sourceUrl,
                        gameCount: gameData.length,
                        data: gameData
                    };

                    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
                    console.log(`✅ Alternative method succeeded! Downloaded ${gameData.length} games`);

                    // Show sample games
                    console.log('\n📋 Sample games:');
                    gameData.slice(0, 5).forEach(game => {
                        console.log(`  • ${game.game} (${game.server}) - Reset: ${game.dailyReset} ${game.timezone}`);
                    });
                    return;
                }
            } catch (evalError) {
                console.error('❌ Alternative method also failed:', evalError.message);
            }

            process.exit(1);
        }
    });

}).on('error', (error) => {
    console.error('❌ Download failed:', error.message);
    process.exit(1);
});