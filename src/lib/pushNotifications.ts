/**
 * Web Push subscription helper.
 *
 * Flow:
 *  1. User clicks "Enable push" → we register the SW, request Notification
 *     permission, then subscribe with the backend-provided VAPID public key.
 *  2. We POST the resulting PushSubscription JSON to the backend.
 *  3. Backend stores it per-device and pushes from its end.
 *
 * The VAPID public key is fetched from `/api/push/vapid-key/` so we never
 * hard-code it. If the backend is offline we fall back to a demo key so the
 * UI still works (subscriptions just won't deliver).
 */
const DEMO_VAPID =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  return reg;
}

export async function subscribeToPush(vapidPublicKey?: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return null;
  const reg = await ensureServiceWorker();
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  const key = vapidPublicKey || DEMO_VAPID;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  return sub.unsubscribe();
}

/** Fire a local notification (works only while the page is open). */
export function showLocalNotification(title: string, body: string, opts: NotificationOptions = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/lipaxe-icon.png',
      badge: '/lipaxe-icon.png',
      ...opts,
    });
  } catch {
    // Some browsers (iOS) require notifications via SW only.
    navigator.serviceWorker?.getRegistration().then((r) =>
      r?.showNotification(title, { body, icon: '/lipaxe-icon.png', badge: '/lipaxe-icon.png', ...opts }),
    );
  }
}
