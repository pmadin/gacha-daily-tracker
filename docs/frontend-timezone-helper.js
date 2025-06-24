// Frontend helper for timezone detection
// This code would run in your frontend application

class TimezoneHelper {
  /**
   * Detect user's timezone using browser API
   */
  static detectBrowserTimezone() {
    try {
      // Modern browsers support this
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.error('Failed to detect timezone:', error);
      return null;
    }
  }

  /**
   * Get user's current local time
   */
  static getCurrentLocalTime() {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Register user with auto-detected timezone
   */
  static async registerWithTimezone(userData) {
    // Auto-detect timezone if not provided
    if (!userData.timezone) {
      userData.timezone = this.detectBrowserTimezone();
    }

    const response = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Also send timezone in header as backup
        'X-User-Timezone': userData.timezone || this.detectBrowserTimezone()
      },
      body: JSON.stringify(userData)
    });

    return response.json();
  }

  /**
   * Fetch available timezones from API
   */
  static async fetchAvailableTimezones() {
    const response = await fetch('http://localhost:4000/api/auth/timezones');
    const data = await response.json();
    return data.timezones;
  }

  /**
   * Create a timezone selector HTML
   */
  static async createTimezoneSelector() {
    const timezones = await this.fetchAvailableTimezones();
    const userTimezone = this.detectBrowserTimezone();
    
    let html = '<select id="timezone-selector" name="timezone">';
    
    // Add auto-detect option
    html += `<option value="">Auto-detect (${userTimezone})</option>`;
    
    // Add grouped timezones
    for (const [region, tzList] of Object.entries(timezones)) {
      html += `<optgroup label="${region}">`;
      
      tzList.forEach(tz => {
        const selected = tz.timezone === userTimezone ? 'selected' : '';
        html += `<option value="${tz.timezone}" ${selected}>
                   ${tz.label} (${tz.offset})
                 </option>`;
      });
      
      html += '</optgroup>';
    }
    
    html += '</select>';
    return html;
  }

  /**
   * Convert game reset time to user's local time
   */
  static convertResetTimeToLocal(resetTime, gameTimezone, userTimezone) {
    // This is a simplified version - use a library like moment-timezone in production
    const [hours, minutes] = resetTime.split(':');
    const gameDate = new Date();
    gameDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Get timezone offset difference
    const gameOffset = this.getTimezoneOffset(gameTimezone);
    const userOffset = this.getTimezoneOffset(userTimezone);
    const offsetDiff = userOffset - gameOffset;
    
    // Adjust time
    gameDate.setHours(gameDate.getHours() + offsetDiff);
    
    return gameDate.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Simple timezone offset calculator (replace with moment-timezone in production)
   */
  static getTimezoneOffset(timezone) {
    // This is a simplified mapping - use proper library in production
    const offsets = {
      'America/Los_Angeles': -8,
      'America/New_York': -5,
      'Europe/London': 0,
      'Europe/Paris': 1,
      'Asia/Tokyo': 9,
      'Asia/Seoul': 9,
      'Asia/Shanghai': 8,
      'Asia/Singapore': 8,
      'Australia/Sydney': 11,
      // Add more as needed
    };
    return offsets[timezone] || 0;
  }
}

// Example usage in your frontend:

// 1. Auto-detect and register
async function registerUser() {
  const userData = {
    username: 'devadmintest',
    email: 'player@example.com',
    password: 'MySecure123!Pass'
    // timezone will be auto-detected
  };
  
  try {
    const result = await TimezoneHelper.registerWithTimezone(userData);
    console.log('Registration successful:', result);
  } catch (error) {
    console.error('Registration failed:', error);
  }
}

// 2. Create timezone selector in your form
async function setupRegistrationForm() {
  const timezoneSelector = await TimezoneHelper.createTimezoneSelector();
  document.getElementById('timezone-container').innerHTML = timezoneSelector;
}

// 3. Display game reset times in user's local time
function displayGameResetTime(game, userTimezone) {
  const localResetTime = TimezoneHelper.convertResetTimeToLocal(
    game.daily_reset,
    game.timezone,
    userTimezone
  );
  
  return `${game.name} resets at ${localResetTime} your time`;
}