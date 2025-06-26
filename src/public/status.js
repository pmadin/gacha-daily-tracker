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
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Data received:', data);

        // Update overall status
        const isHealthy = data.status === 'OK' && data.database?.status === 'healthy';

        overallStatus.className = `status-indicator ${isHealthy ? 'status-operational' : 'status-error'}`;
        statusText.textContent = isHealthy ? 'All Systems Operational' : 'System Issues Detected';

        // Convert UTC timestamp to local time
        const utcTime = new Date(data.timestamp);
        const localTime = utcTime.toLocaleString();
        timestamp.textContent = `Last checked: ${localTime}`;

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

        servicesDiv.innerHTML = services.map(service => `
            <div class="service ${service.healthy ? '' : 'error'}">
                <h3>${service.name}</h3>
                <div class="service-status">${service.status}</div>
            </div>
        `).join('');

        // Update last updated time
        lastUpdated.textContent = new Date().toLocaleString();

    } catch (error) {
        console.error('Error fetching status:', error);

        overallStatus.className = 'status-indicator status-error';
        statusText.textContent = 'Unable to Check Status';
        timestamp.textContent = `Connection failed: ${error.message}`;

        servicesDiv.innerHTML = `
            <div class="service error">
                <h3>Connection Error</h3>
                <div class="service-status">Unable to reach server: ${error.message}</div>
            </div>
        `;
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
    // DOM hasn't finished loading yet
    console.log('DOM still loading, waiting for DOMContentLoaded');
} else {
    // DOM has already loaded
    console.log('DOM already loaded, initializing immediately');
    // Initialize immediately
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