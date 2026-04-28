import {
  generateSecret as otplibGenerateSecret,
  generate,
  verify,
  generateURI,
} from "otplib";

export function generateSecret(): string {
  return otplibGenerateSecret();
}

export function buildOtpAuthUrl(
  account: string,
  secret: string,
  issuer = "Lipaxe"
): string {
  return generateURI({
    issuer,
    label: account,
    secret,
  });
}

export async function generateToken(secret: string): Promise<string> {
  return await generate({ secret });
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<boolean> {
  try {
    const result = await verify({
      token: token.replace(/\s/g, ""),
      secret,
    });
    return result.valid;
  } catch {
    return false;
  }
}


export function generateBackupCodes(count = 8): string[] {
  const out: string[] = [];
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 10; j++) {
      code += alpha[Math.floor(Math.random() * alpha.length)];
    }
    out.push(code.slice(0, 5) + '-' + code.slice(5));
  }
  return out;
}