import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  getClientIp,
  getDb,
  hashValue,
  jsonError,
  parseJson
} from '$lib/server/leaderboard';

const SESSION_TABLE = 'session_nonces';
const TTL_MINUTES = 12;
const MAX_ACTIVE_SESSIONS_PER_IP = 5;

export const POST: RequestHandler = async (event) => {
  const db = getDb(event);
  if (!db) return jsonError('offline', 503);

  const body = await parseJson(event.request);
  const playerName =
    typeof (body as { playerName?: unknown })?.playerName === 'string'
      ? (body as { playerName: string }).playerName.trim()
      : '';
  if (!playerName) {
    return jsonError('nickname-required', 400);
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + TTL_MINUTES * 60 * 1000).toISOString();

  const ip = getClientIp(event.request);
  const ipHash = await hashValue(ip);

  await db.prepare(`DELETE FROM ${SESSION_TABLE} WHERE expires_at < ?`).bind(nowIso).run();

  const countRow = await db
    .prepare(`SELECT COUNT(*) AS count FROM ${SESSION_TABLE} WHERE ip_hash = ? AND expires_at > ?`)
    .bind(ipHash, nowIso)
    .first();
  const activeCount = Number((countRow as { count?: number } | null)?.count ?? 0);

  if (activeCount >= MAX_ACTIVE_SESSIONS_PER_IP) {
    return jsonError('rate-limited', 429);
  }

  const nonce = crypto.randomUUID();
  const insert = await db
    .prepare(
      `INSERT INTO ${SESSION_TABLE} (nonce, player_name, ip_hash, started_at, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(nonce, playerName, ipHash, nowIso, expiresAt, nowIso)
    .run();

  if (!insert.success) {
    return jsonError('session-create-failed', 500);
  }

  return json({ nonce, expiresAt });
};
