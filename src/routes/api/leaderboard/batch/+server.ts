import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GAME_MODES } from '$lib/game/modes';
import type { GameModeId } from '$lib/game/types';
import { getDb, jsonError, parseJson } from '$lib/server/leaderboard';
import type { LeaderboardBatchRequest } from '$lib/leaderboard/types';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const leaderboardModeIds = new Set<GameModeId>(
  GAME_MODES.filter((mode) => mode.metric).map((mode) => mode.id)
);

const isLeaderboardModeId = (value: unknown): value is GameModeId =>
  typeof value === 'string' && leaderboardModeIds.has(value as GameModeId);

const buildQuery = (where: string) => `
  SELECT id, mode, metric_value, score, time_ms, lines, pieces, pps, seed, player_name, created_at, client_version
  FROM (
    SELECT
      id, mode, metric_value, score, time_ms, lines, pieces, pps, seed, player_name, created_at, client_version,
      ROW_NUMBER() OVER (
        PARTITION BY mode
        ORDER BY
          CASE WHEN metric = 'time' THEN metric_value ELSE -metric_value END ASC,
          datetime(created_at) ASC
      ) AS rn
    FROM scores
    WHERE ${where}
  )
  WHERE rn <= ?
`;

export const POST: RequestHandler = async (event) => {
  const db = getDb(event);
  if (!db) return jsonError('offline', 503);

  const body = (await parseJson(event.request)) as LeaderboardBatchRequest | null;
  const modes = Array.isArray(body?.modes)
    ? Array.from(new Set(body.modes.filter(isLeaderboardModeId)))
    : [];
  if (modes.length === 0) {
    return json({ entries: [] });
  }

  const scopeRaw = body?.scope;
  const scope = scopeRaw === 'both' ? 'both' : scopeRaw === 'mine' ? 'mine' : 'global';
  const playerName = typeof body?.playerName === 'string' ? body.playerName.trim() : '';
  if (scope === 'mine' && !playerName) {
    return json({ entries: [] });
  }

  const rawLimit = body?.limit;
  const normalizedLimit =
    typeof rawLimit === 'number' && Number.isFinite(rawLimit) ? Math.round(rawLimit) : DEFAULT_LIMIT;
  const limit = Math.min(Math.max(normalizedLimit, 1), MAX_LIMIT);

  const placeholders = modes.map(() => '?').join(', ');
  const modeParams: Array<string | number> = [...modes];
  const whereGlobal = `mode IN (${placeholders})`;

  if (scope === 'both') {
    const globalParams = [...modeParams, limit];
    const globalResults = await db
      .prepare(buildQuery(whereGlobal))
      .bind(...globalParams)
      .all();

    if (!playerName) {
      return json({ global: globalResults.results ?? [], mine: [] });
    }

    const whereMine = `${whereGlobal} AND player_name = ?`;
    const mineParams = [...modeParams, playerName, limit];
    const mineResults = await db
      .prepare(buildQuery(whereMine))
      .bind(...mineParams)
      .all();

    return json({ global: globalResults.results ?? [], mine: mineResults.results ?? [] });
  }

  const params = scope === 'mine' ? [...modeParams, playerName, limit] : [...modeParams, limit];
  const where = scope === 'mine' ? `${whereGlobal} AND player_name = ?` : whereGlobal;
  const { results } = await db.prepare(buildQuery(where)).bind(...params).all();
  return json({ entries: results ?? [] });
};
