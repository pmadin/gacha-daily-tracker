import webpush from 'web-push';

let configured = false;

export function initWebPush(): boolean {
  const { VAPID_CONTACT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_CONTACT || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('⚠️  VAPID keys not configured — push notifications disabled');
    return false;
  }
  webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  console.log('🔔 Web push configured');
  return true;
}

export function isWebPushConfigured(): boolean {
  return configured;
}

export { webpush };
