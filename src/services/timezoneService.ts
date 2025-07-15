import { Request } from 'express';

interface TimezoneInfo {
  timezone: string;
  offset: string;
  label: string;
  region?: string;
}

class TimezoneService {
  // Common timezone mappings used by gacha games
  private static readonly COMMON_TIMEZONES: TimezoneInfo[] = [
    // Americas
    { timezone: 'America/Los_Angeles', offset: 'UTC-8', label: 'Pacific Time (US)', region: 'Americas' },
    { timezone: 'America/Denver', offset: 'UTC-7', label: 'Mountain Time (US)', region: 'Americas' },
    { timezone: 'America/Chicago', offset: 'UTC-6', label: 'Central Time (US)', region: 'Americas' },
    { timezone: 'America/New_York', offset: 'UTC-5', label: 'Eastern Time (US)', region: 'Americas' },
    { timezone: 'America/Sao_Paulo', offset: 'UTC-3', label: 'Brazil Time', region: 'Americas' },
    { timezone: 'America/Argentina/Buenos_Aires', offset: 'UTC-3', label: 'Argentina Time', region: 'Americas' },
    
    // Europe
    { timezone: 'Europe/London', offset: 'UTC+0', label: 'British Time', region: 'Europe' },
    { timezone: 'Europe/Paris', offset: 'UTC+1', label: 'Central European Time', region: 'Europe' },
    { timezone: 'Europe/Berlin', offset: 'UTC+1', label: 'Germany Time', region: 'Europe' },
    { timezone: 'Europe/Moscow', offset: 'UTC+3', label: 'Moscow Time', region: 'Europe' },
    
    // Asia
    { timezone: 'Asia/Tokyo', offset: 'UTC+9', label: 'Japan Time', region: 'Asia' },
    { timezone: 'Asia/Seoul', offset: 'UTC+9', label: 'Korea Time', region: 'Asia' },
    { timezone: 'Asia/Shanghai', offset: 'UTC+8', label: 'China Time', region: 'Asia' },
    { timezone: 'Asia/Hong_Kong', offset: 'UTC+8', label: 'Hong Kong Time', region: 'Asia' },
    { timezone: 'Asia/Singapore', offset: 'UTC+8', label: 'Singapore Time', region: 'Asia' },
    { timezone: 'Asia/Bangkok', offset: 'UTC+7', label: 'Thailand Time', region: 'Asia' },
    { timezone: 'Asia/Jakarta', offset: 'UTC+7', label: 'Indonesia Time (WIB)', region: 'Asia' },
    { timezone: 'Asia/Manila', offset: 'UTC+8', label: 'Philippines Time', region: 'Asia' },
    { timezone: 'Asia/Kolkata', offset: 'UTC+5:30', label: 'India Time', region: 'Asia' },
    { timezone: 'Asia/Dubai', offset: 'UTC+4', label: 'UAE Time', region: 'Asia' },
    
    // Oceania
    { timezone: 'Australia/Sydney', offset: 'UTC+11', label: 'Sydney Time', region: 'Oceania' },
    { timezone: 'Australia/Melbourne', offset: 'UTC+11', label: 'Melbourne Time', region: 'Oceania' },
    { timezone: 'Australia/Perth', offset: 'UTC+8', label: 'Perth Time', region: 'Oceania' },
    { timezone: 'Pacific/Auckland', offset: 'UTC+13', label: 'New Zealand Time', region: 'Oceania' },
    
    // Additional UTC offsets for edge cases
    { timezone: 'Etc/GMT+12', offset: 'UTC-12', label: 'UTC-12', region: 'UTC' },
    { timezone: 'Etc/GMT-14', offset: 'UTC+14', label: 'UTC+14', region: 'UTC' },
  ];

  // Mapping of common timezone abbreviations to IANA timezones
  private static readonly TIMEZONE_ALIASES: Record<string, string> = {
    'PST': 'America/Los_Angeles',
    'PDT': 'America/Los_Angeles',
    'MST': 'America/Denver',
    'MDT': 'America/Denver',
    'CDT': 'America/Chicago',
    'EST': 'America/New_York',
    'EDT': 'America/New_York',
    'GMT': 'Europe/London',
    'BST': 'Europe/London',
    'CET': 'Europe/Paris',
    'CEST': 'Europe/Paris',
    'JST': 'Asia/Tokyo',
    'KST': 'Asia/Seoul',
    'CST': 'Asia/Shanghai', // China Standard Time
    'IST': 'Asia/Kolkata',
    'AEST': 'Australia/Sydney',
    'AEDT': 'Australia/Sydney',
  };

  /**
   * Get all supported timezones grouped by region
   */
  static getAllTimezones(): Record<string, TimezoneInfo[]> {
    const grouped: Record<string, TimezoneInfo[]> = {};
    
    this.COMMON_TIMEZONES.forEach(tz => {
      const region = tz.region || 'Other';
      if (!grouped[region]) {
        grouped[region] = [];
      }
      grouped[region].push(tz);
    });
    
    return grouped;
  }

  /**
   * Get a flat list of all timezones
   */
  static getTimezoneList(): TimezoneInfo[] {
    return this.COMMON_TIMEZONES;
  }

  /**
   * Validate if a timezone is supported
   */
  static isValidTimezone(timezone: string): boolean {
    const normalizedTz = this.normalizeTimezone(timezone);
    return this.COMMON_TIMEZONES.some(tz => tz.timezone === normalizedTz);
  }

  /**
   * Normalize timezone input (handle aliases and common mistakes)
   */
  static normalizeTimezone(input: string): string {
    // if timezone is invalid, default to American PST
    if (!input) return 'America/Los_Angeles';

    // Check if it's already a valid IANA timezone
    if (this.COMMON_TIMEZONES.some(tz => tz.timezone === input)) {
      return input;
    }

    // Check aliases
    const upperInput = input.toUpperCase();
    if (this.TIMEZONE_ALIASES[upperInput]) {
      return this.TIMEZONE_ALIASES[upperInput];
    }

    // Try to match by offset (e.g., "UTC-8" -> "America/Los_Angeles")
    const offsetMatch = input.match(/UTC([+-]\d+)/i);
    if (offsetMatch) {
      const offset = `UTC${offsetMatch[1]}`;
      const matchingTz = this.COMMON_TIMEZONES.find(tz => tz.offset === offset);
      if (matchingTz) return matchingTz.timezone;
    }

    // Default fallback
    return 'America/Los_Angeles';
  }

  /**
   * Get timezone from IP address (requires external service)
   * This is a placeholder - you'd need to integrate with a service like ipapi.co
   */
  static async getTimezoneFromIP(ip: string): Promise<string> {
    try {
      // In production, you'd call an IP geolocation service
      // Example: const response = await axios.get(`https://ipapi.co/${ip}/timezone/`);
      // return response.data;
      
      // For now, return default
      return 'America/Los_Angeles';
    } catch (error) {
      console.error('Failed to get timezone from IP:', error);
      return 'America/Los_Angeles';
    }
  }

  /**
   * Get user's timezone from various sources
   */
  static async detectUserTimezone(req: Request): Promise<string> {
    // 1. Check if timezone is provided in request body
    if (req.body?.timezone) {
      return this.normalizeTimezone(req.body.timezone);
    }

    // 2. Check if timezone is in headers (from frontend)
    const headerTimezone = req.headers['x-user-timezone'] as string;
    if (headerTimezone) {
      return this.normalizeTimezone(headerTimezone);
    }

    // 3. Try to get from IP (in production)
    const userIP = req.ip || req.socket.remoteAddress || '';
    if (userIP && userIP !== '::1' && userIP !== '127.0.0.1') {
      const ipTimezone = await this.getTimezoneFromIP(userIP);
      if (ipTimezone) return ipTimezone;
    }

    // 4. Default fallback
    return 'America/Los_Angeles';
  }

  /**
   * Convert time from one timezone to another
   */
  static convertTime(time: string, fromTimezone: string, toTimezone: string): Date {
    // This is a simplified version - in production, use a library like moment-timezone
    const date = new Date(`2025-01-01T${time}:00`);
    // Add proper timezone conversion logic here
    return date;
  }

  /**
   * Get current time in a specific timezone
   */
  static getCurrentTimeInTimezone(timezone: string): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(new Date());
  }
}

export default TimezoneService;