import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cached: string | null = null;
let inflight: Promise<string> | null = null;

/**
 * Stable device fingerprint (browser-only). Cached in-memory + localStorage.
 * NOT a security boundary on its own — always paired with backend session checks.
 */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  const stored = localStorage.getItem('lipaxe-device-id');
  if (stored) {
    cached = stored;
    return stored;
  }
  if (!inflight) {
    inflight = (async () => {
      try {
        const fp = await FingerprintJS.load();
        const r = await fp.get();
        const id = r.visitorId;
        localStorage.setItem('lipaxe-device-id', id);
        cached = id;
        return id;
      } catch {
        const id = 'dev_' + Math.random().toString(36).slice(2, 14);
        localStorage.setItem('lipaxe-device-id', id);
        cached = id;
        return id;
      } finally {
        inflight = null;
      }
    })();
  }
  return inflight;
}

export function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  const platform =
    /iPhone|iPad/.test(ua) ? 'iOS'
    : /Android/.test(ua) ? 'Android'
    : /Mac/.test(ua) ? 'macOS'
    : /Windows/.test(ua) ? 'Windows'
    : /Linux/.test(ua) ? 'Linux'
    : 'Unknown';
  const browser =
    /Edg\//.test(ua) ? 'Edge'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Safari\//.test(ua) ? 'Safari'
    : 'Browser';
  return `${browser} on ${platform}`;
}
