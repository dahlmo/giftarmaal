import { Request } from "express";

type LoginAttempt = {
  count: number;
  blockedUntil?: number; // timestamp (ms)
};

const LOGIN_ATTEMPTS = new Map<string, LoginAttempt>();
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 60 * 60 * 1000; // 1 hr

export function getClientIp(req: Request): string {
  const xfwd = (req.headers["x-forwarded-for"] as string | undefined)
    ?.split(",")[0]
    ?.trim();
  return xfwd || req.ip || (req.socket as any)?.remoteAddress || "unknown";
}

export function isBlocked(ip: string): boolean {
  const rec = LOGIN_ATTEMPTS.get(ip);
  if (!rec) return false;

  if (rec.blockedUntil && rec.blockedUntil > Date.now()) {
    return true;
  }

  if (rec.blockedUntil && rec.blockedUntil <= Date.now()) {
    LOGIN_ATTEMPTS.delete(ip);
  }
  return false;
}

export function registerFailure(ip: string) {
  const now = Date.now();
  const rec = LOGIN_ATTEMPTS.get(ip) || { count: 0 };
  rec.count += 1;

  if (rec.count >= MAX_ATTEMPTS) {
    rec.blockedUntil = now + BLOCK_MS;
  }

  LOGIN_ATTEMPTS.set(ip, rec);
}

export function clearFailures(ip: string) {
  LOGIN_ATTEMPTS.delete(ip);
}
