import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';

const encoder = new TextEncoder();

export const jsonError = (error: string, status = 400) => json({ error }, { status });

export const parseJson = async (request: Request): Promise<unknown | null> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

export const getDb = (event: RequestEvent): D1Database | null => {
  const candidate = event.platform?.env?.DB as D1Database | undefined;
  if (candidate && typeof (candidate as D1Database).prepare === 'function') {
    return candidate;
  }
  return null;
};

export const getClientIp = (request: Request): string => {
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp;
  const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
  const ip = forwardedFor.split(',')[0]?.trim();
  if (!ip) return 'unknown';
  const ipv4Match = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);
  if (ipv4Match) return ipv4Match[1] ?? ip;
  const bracketedMatch = ip.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketedMatch) return bracketedMatch[1] ?? ip;
  return ip;
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');

export const hashValue = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return toHex(digest);
};

export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
