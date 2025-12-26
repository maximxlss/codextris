import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, isNumber, jsonError, parseJson } from '$lib/server/leaderboard';

const SESSION_TABLE = 'session_nonces';
const SCORE_TABLE = 'scores';
const GRACE_MS = 2000;
const VALIDATION_ERROR = 'validation-error';

export const POST: RequestHandler = async (event) => {
  const db = getDb(event);
  if (!db) return jsonError('offline', 503);

  const body = await parseJson(event.request);
  const nonce = typeof (body as { nonce?: unknown })?.nonce === 'string' ? (body as { nonce: string }).nonce : '';
  const modeId =
    typeof (body as { modeId?: unknown })?.modeId === 'string'
      ? (body as { modeId: string }).modeId
      : '';
  const metric =
    typeof (body as { metric?: unknown })?.metric === 'string'
      ? (body as { metric: string }).metric
      : '';
  const playerName =
    typeof (body as { playerName?: unknown })?.playerName === 'string'
      ? (body as { playerName: string }).playerName.trim()
      : '';

  if (!nonce || !modeId || !metric || !playerName) {
    return jsonError('bad-request', 400);
  }

  if (metric !== 'score' && metric !== 'time') {
    return jsonError('bad-request', 400);
  }

  const metricValueRaw = (body as { metricValue?: unknown })?.metricValue;
  const scoreRaw = (body as { score?: unknown })?.score ?? 0;
  const timeMsRaw = (body as { timeMs?: unknown })?.timeMs ?? 0;
  const linesRaw = (body as { lines?: unknown })?.lines ?? 0;
  const piecesRaw = (body as { pieces?: unknown })?.pieces ?? 0;
  if (
    !isNumber(metricValueRaw) ||
    !isNumber(scoreRaw) ||
    !isNumber(timeMsRaw) ||
    !isNumber(linesRaw) ||
    !isNumber(piecesRaw)
  ) {
    return jsonError('bad-request', 400);
  }

  const metricValue = metricValueRaw;
  const score = scoreRaw;
  const timeMs = timeMsRaw;
  const lines = linesRaw;
  const pieces = piecesRaw;

  const computedPps = timeMs > 0 ? pieces / (timeMs / 1000) : 0;

  if (modeId === 'blitz') {
    if (timeMs < 118000 || timeMs > 122000) {
      return jsonError(VALIDATION_ERROR, 400);
    }
  }

  if (modeId === 'sprint40') {
    if (timeMs < 10000) {
      return jsonError(VALIDATION_ERROR, 400);
    }
    if (pieces < 100) {
      return jsonError(VALIDATION_ERROR, 400);
    }
    if (lines < 40 || lines > 43) {
      return jsonError(VALIDATION_ERROR, 400);
    }
  }

  const session = await db
    .prepare(
      `SELECT nonce, player_name, started_at, expires_at
       FROM ${SESSION_TABLE}
       WHERE nonce = ?
       LIMIT 1`
    )
    .bind(nonce)
    .first();

  if (!session) {
    return jsonError(VALIDATION_ERROR, 400);
  }

  const sessionRow = session as {
    player_name: string;
    started_at: string;
    expires_at: string;
  };

  if (sessionRow.player_name !== playerName) {
    return jsonError(VALIDATION_ERROR, 400);
  }
  const expiresAt = new Date(sessionRow.expires_at).getTime();
  if (expiresAt < Date.now()) {
    return jsonError('session-expired', 400);
  }

  const startedAt = new Date(sessionRow.started_at).getTime();
  const elapsed = Date.now() - startedAt;
  if (elapsed + GRACE_MS < timeMs) {
    return jsonError(VALIDATION_ERROR, 400);
  }

  const createdAt = new Date().toISOString();
  const insert = await db
    .prepare(
      `INSERT INTO ${SCORE_TABLE}
        (id, mode, metric, metric_value, score, time_ms, lines, pieces, pps, player_name, seed, client_version, nonce, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      modeId,
      metric,
      metricValue,
      score,
      timeMs,
      lines,
      pieces,
      computedPps,
      playerName,
      isNumber((body as { seed?: unknown })?.seed) ? (body as { seed: number }).seed : null,
      typeof (body as { clientVersion?: unknown })?.clientVersion === 'string'
        ? (body as { clientVersion: string }).clientVersion
        : null,
      nonce,
      createdAt
    )
    .run();

  if (!insert.success) {
    return jsonError('insert-failed', 500);
  }

  await db.prepare(`DELETE FROM ${SESSION_TABLE} WHERE nonce = ?`).bind(nonce).run();

  return json({ ok: true });
};
