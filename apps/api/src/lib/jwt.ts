import crypto from 'node:crypto';

type JwtPayload = Record<string, unknown> & {
  sub: string;
  exp?: number;
};

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function sign(input: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(input).digest('base64url');
}

export function signJwt(payload: JwtPayload, secret: string, expiresInSeconds: number) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const signature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt<T extends JwtPayload = JwtPayload>(token: string, secret: string): T {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token');
  }

  const [header, payload, signature] = parts;
  const expectedSignature = sign(`${header}.${payload}`, secret);
  if (signature.length !== expectedSignature.length) {
    throw new Error('Invalid token');
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Invalid token');
  }

  const parsed = JSON.parse(base64UrlDecode(payload)) as T;
  if (typeof parsed.exp === 'number' && parsed.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return parsed;
}
