/**
 * Persistent "pending email verification" state.
 *
 * Use case: a user signs up, closes the browser before entering the OTP,
 * then comes back later. We store a *minimal*, *signed-style* token locally
 * so they can resume — but every operation still goes through the backend
 * (resend OTP, verify OTP) which is the source of truth. We never trust
 * this localStorage payload to grant access.
 */
const KEY = 'lipaxe-pending-verify';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface PendingVerification {
  email: string;
  createdAt: number;
  redirect?: string;
  reference?: string;
  // opaque short-lived continuation token from backend (if provided)
  continuation?: string;
}

export function setPendingVerification(p: Omit<PendingVerification, 'createdAt'>) {
  const value: PendingVerification = { ...p, createdAt: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(value)); } catch {}
}

export function getPendingVerification(): PendingVerification | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as PendingVerification;
    if (!v?.email || Date.now() - v.createdAt > MAX_AGE_MS) {
      clearPendingVerification();
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

export function clearPendingVerification() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function updatePendingEmail(newEmail: string) {
  const cur = getPendingVerification();
  if (!cur) return;
  setPendingVerification({ ...cur, email: newEmail });
}
