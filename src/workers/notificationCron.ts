import cron from 'node-cron';
import database from '../config/database';
import { webpush, isWebPushConfigured } from '../config/webpush';

interface PendingNotification {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: number;
  game_id: number;
  game_name: string;
  icon_name: string | null;
  offset_minutes: number;
}

// Find every (user, game) pair where the push should fire this minute.
// Conditions:
//   - User has a push subscription
//   - Game has a non-zero custom_reminder_offset (0 = "No reminder" for that game)
//   - Game is in user's list and not yet completed for the current game-local period
//   - Minutes until next reset falls within ±0.5 min of the per-game offset
const QUERY = `
  WITH candidates AS (
    SELECT
      ps.endpoint,
      ps.p256dh,
      ps.auth,
      ps.user_id,
      g.id    AS game_id,
      g.name  AS game_name,
      g.icon_name,
      ug.custom_reminder_offset AS offset_minutes,
      EXTRACT(EPOCH FROM (
        CASE
          WHEN (CURRENT_TIMESTAMP AT TIME ZONE g.timezone)::time < g.daily_reset
          THEN ((CURRENT_TIMESTAMP AT TIME ZONE g.timezone)::date + g.daily_reset)
                 AT TIME ZONE g.timezone
          ELSE  ((CURRENT_TIMESTAMP AT TIME ZONE g.timezone)::date + INTERVAL '1 day' + g.daily_reset)
                 AT TIME ZONE g.timezone
        END - CURRENT_TIMESTAMP
      )) / 60.0 AS minutes_until_reset
    FROM push_subscriptions ps
    JOIN user_games ug  ON ug.user_id = ps.user_id AND ug.custom_reminder_offset > 0
    JOIN games g        ON g.id  = ug.game_id AND g.is_active = true
    LEFT JOIN daily_completions dc
           ON dc.user_id = ug.user_id
          AND dc.game_id = ug.game_id
          AND dc.completion_date = (
                CASE
                  WHEN (CURRENT_TIMESTAMP AT TIME ZONE g.timezone)::time >= g.daily_reset
                  THEN (CURRENT_TIMESTAMP AT TIME ZONE g.timezone)::date
                  ELSE (CURRENT_TIMESTAMP AT TIME ZONE g.timezone)::date - 1
                END
              )
    WHERE dc.id IS NULL
  )
  SELECT * FROM candidates
  WHERE minutes_until_reset BETWEEN (offset_minutes - 0.5) AND (offset_minutes + 0.5)
`;

async function removeExpiredSubscription(endpoint: string): Promise<void> {
  try {
    await database.query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1',
      [endpoint]
    );
  } catch {
    // best-effort
  }
}

async function runNotificationJob(): Promise<void> {
  if (!isWebPushConfigured()) return;

  let rows: PendingNotification[];
  try {
    const result = await database.query(QUERY);
    rows = result.rows;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Notification cron query failed:', msg);
    return;
  }

  if (rows.length === 0) return;

  console.log(`🔔 Sending ${rows.length} push notification(s)`);

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  await Promise.all(
    rows.map(async (row) => {
      const m = row.offset_minutes;
      const timeLabel = m < 60
        ? `${m} minute${m === 1 ? '' : 's'}`
        : `${m / 60} hour${m / 60 === 1 ? '' : 's'}`;

      const icon = row.icon_name
        ? `${frontendUrl}/icons/${row.icon_name}.gif`
        : `${frontendUrl}/icons/placeholder.svg`;

      const payload = JSON.stringify({
        title: 'GachaDaily',
        body: `${row.game_name} resets in ${timeLabel}`,
        icon,
        tag: `gachadaily-${row.game_id}`,
        data: { url: '/dashboard' },
      });

      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };

      try {
        await webpush.sendNotification(subscription, payload);
      } catch (error: unknown) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          // Subscription is expired or invalid — remove it
          await removeExpiredSubscription(row.endpoint);
        } else {
          const msg = error instanceof Error ? error.message : String(error);
          console.error(`Push failed for user ${row.user_id} / game ${row.game_id}:`, msg);
        }
      }
    })
  );
}

export function startNotificationCron(): void {
  // Fires at the top of every minute
  cron.schedule('* * * * *', () => {
    runNotificationJob().catch((err) => {
      console.error('Notification cron error:', err);
    });
  });
  console.log('🔔 Notification cron started (runs every minute)');
}
