/**
 * Frontend security helpers.
 * Note: real protection lives on the backend — these are defence-in-depth.
 */
import DOMPurify from 'dompurify';

/** Strip every tag/attribute, keep only safe text. Use before rendering user input. */
export const sanitizeText = (input: string): string =>
  DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

/** Sanitize a small allow-list of inline HTML (bold/italic/links). */
export const sanitizeRichText = (input: string): string =>
  DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

/** Frontend rate-limiter: allow `max` calls per `windowMs`. */
export class Throttle {
  private hits: number[] = [];
  constructor(private max: number, private windowMs: number) {}
  tryAcquire(): boolean {
    const now = Date.now();
    this.hits = this.hits.filter((t) => now - t < this.windowMs);
    if (this.hits.length >= this.max) return false;
    this.hits.push(now);
    return true;
  }
  reset() {
    this.hits = [];
  }
}

/** PIN: 5 digits exactly, numeric. */
export const PIN_REGEX = /^\d{5}$/;

/** Mask account/card numbers, keeping last 4. */
export const maskAccount = (s: string): string => {
  const clean = s.replace(/\s/g, '');
  if (clean.length <= 4) return clean;
  return '•••• ' + clean.slice(-4);
};

/** Build a redirect-safe path (prevents open-redirect attacks). */
export const safePath = (raw: string | null, fallback = '/app'): string => {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  return raw;
};

/** Boolean variant — true if `raw` is an internal, single-slash path. */
export const isSafeRedirect = (raw: string | null | undefined): boolean => {
  if (!raw) return false;
  return raw.startsWith('/') && !raw.startsWith('//');
};
