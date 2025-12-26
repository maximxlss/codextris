import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, jsonError, parseJson } from '$lib/server/leaderboard';

const SESSION_TABLE = 'session_nonces';

export const POST: RequestHandler = async (event) => {
  const db = getDb(event);
  if (!db) return jsonError('offline', 503);

  const body = await parseJson(event.request);
  const nonce =
    typeof (body as { nonce?: unknown })?.nonce === 'string'
      ? (body as { nonce: string }).nonce.trim()
      : '';
  if (!nonce) {
    return jsonError('bad-request', 400);
  }

  const result = await db.prepare(`DELETE FROM ${SESSION_TABLE} WHERE nonce = ?`).bind(nonce).run();
  if (!result.success) {
    return jsonError('delete-failed', 500);
  }

  return json({ ok: true });
};
