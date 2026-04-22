// TOTP helpers powered by otplib (RFC 6238). Frontend uses these only for
// the demo/mock flow. In production the backend MUST own secret generation
// and verification — never trust client-side TOTP checks.
import * as otplib from 'otplib';
const authenticator = (otplib as any).authenticator ?? otplib.default?.authenticator;

authenticator.options = { window: 1, step: 30, digits: 6 };

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpAuthUrl(account: string, secret: string, issuer = 'Lipaxe'): string {
  return authenticator.keyuri(account, issuer, secret);
}

export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: token.replace(/\s/g, ''), secret });
  } catch {
    return false;
  }
}

export function generateBackupCodes(count = 8): string[] {
  const out: string[] = [];
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 10; j++) code += alpha[Math.floor(Math.random() * alpha.length)];
    out.push(code.slice(0, 5) + '-' + code.slice(5));
  }
  return out;
}
