// lib/auth.ts

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from './db';

const SESSION_COOKIE_NAME = 'sales_panel_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'sales-panel-control-secret-key-321!';

export interface SessionPayload {
  userId: string;
  role: 'ADMIN' | 'SELLER';
  name: string;
  expires: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Simple secure HMAC signature utility
export function signToken(payload: Omit<SessionPayload, 'expires'>, durationHours = 24 * 7): string {
  const expires = new Date();
  expires.setHours(expires.getHours() + durationHours);

  const fullPayload: SessionPayload = {
    ...payload,
    expires: expires.toISOString(),
  };

  const serialized = JSON.stringify(fullPayload);
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(serialized);
  const signature = hmac.digest('hex');

  // Return base64url encoded payload + signature
  return `${Buffer.from(serialized).toString('base64url')}.${signature}`;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encodedPayload, signature] = parts;
    const serialized = Buffer.from(encodedPayload, 'base64url').toString('utf-8');

    const hmac = crypto.createHmac('sha256', SESSION_SECRET);
    hmac.update(serialized);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) return null;

    const payload: SessionPayload = JSON.parse(serialized);
    
    // Check expiration
    if (new Date(payload.expires).getTime() < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const payload = verifyToken(sessionCookie.value);
  if (!payload) return null;

  // Double check user still exists and is active in DB
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role as 'ADMIN' | 'SELLER',
    allowedPrices: JSON.parse(user.allowedPrices || '[]'),
  };
}

export async function setSessionCookie(payload: Omit<SessionPayload, 'expires'>) {
  const token = signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
