console.log('GameInfo.js loaded successfully');

async function loadGameStats() {
    console.log('loadGameStats function called');
    
    try {
        // Fetch total game count from the games API
        console.log('Fetching game count from /gdt/games...');
        const response = await fetch('/gdt/games?limit=1');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data received:', data);
        
        // Update game count if available
        if (data.total && data.total > 0) {
            const gameCountElement = document.getElementById('gameCount');
            if (gameCountElement) {
                gameCountElement.textContent = data.total;
                console.log(`Updated game count to: ${data.total}`);
            }
        }
        
        // Optionally fetch server statistics
        await loadServerStats();
        
    } catch (error) {
        console.error('Error fetching game stats:', error);
        // Keep default values if fetch fails
    }
}

async function loadServerStats() {
    try {
        console.log('Fetching server stats from /gdt/games/servers/list...');
        const response = await fetch('/gdt/games/servers/list');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Server data received:', data);
        
        // Update server count if available
        if (data.servers && Array.isArray(data.servers)) {
            const serverCountElement = document.getElementById('serverCount');
            if (serverCountElement) {
                serverCountElement.textContent = data.servers.length;
                console.log(`Updated server count to: ${data.servers.length}`);
            }
        }
        
    } catch (error) {
        console.error('Error fetching server stats:', error);
        // Keep default values if fetch fails
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing game info page');
    
    // Load game statistics
    console.log('Starting game stats loading');
    loadGameStats();
});

// Fallback: if DOMContentLoaded has already fired
if (document.readyState === 'loading') {
    console.log('DOM still loading, waiting for DOMContentLoaded');
} else {
    console.log('DOM already loaded, initializing immediately');
    loadGameStats();
}