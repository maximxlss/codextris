import { describe, expect, it } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { POST as startSession } from '../src/routes/api/leaderboard/session/start/+server';
import { POST as submitScore } from '../src/routes/api/leaderboard/session/submit/+server';
import { MAX_NICKNAME_LENGTH } from '../src/lib/leaderboard/constants';

type StatementImpl = {
  first?: () => Promise<unknown>;
  run?: () => Promise<{ success: boolean; meta?: { changes?: number } }>;
  all?: () => Promise<{ results?: unknown[] }>;
};

const makeStatement = (impl: StatementImpl) => ({
  bind: () => makeStatement(impl),
  first: impl.first,
  run: impl.run,
  all: impl.all
});

const makeEvent = (
  payload: unknown,
  db: { prepare: (sql: string) => ReturnType<typeof makeStatement> }
) =>
  ({
    request: new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
    platform: { env: { DB: db } }
  }) as unknown as RequestEvent;

describe('leaderboard session handlers', () => {
  it('rejects overly long nicknames on session start', async () => {
    const db = {
      prepare: () => {
        throw new Error('unexpected db access');
      }
    };
    const response = await startSession(
      makeEvent({ playerName: 'a'.repeat(MAX_NICKNAME_LENGTH + 1) }, db)
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'nickname-too-long' });
  });

  it('rejects metric mismatches for leaderboard submit', async () => {
    const db = {
      prepare: () => {
        throw new Error('unexpected db access');
      }
    };
    const response = await submitScore(
      makeEvent(
        {
          nonce: 'nonce',
          modeId: 'blitz',
          metric: 'time',
          playerName: 'Player',
          metricValue: 120000,
          score: 2000,
          timeMs: 120000,
          lines: 0,
          pieces: 100
        },
        db
      )
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'validation-error' });
  });

  it('rejects duplicate nonce consumption', async () => {
    const now = Date.now();
    const startedAt = new Date(now - 121000).toISOString();
    const expiresAt = new Date(now + 60000).toISOString();
    const db = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT nonce')) {
          return makeStatement({
            first: async () => ({
              nonce: 'nonce',
              player_name: 'Player',
              started_at: startedAt,
              expires_at: expiresAt
            })
          });
        }
        if (sql.includes('DELETE FROM session_nonces')) {
          return makeStatement({
            run: async () => ({ success: true, meta: { changes: 0 } })
          });
        }
        if (sql.includes('INSERT INTO scores')) {
          return makeStatement({
            run: async () => {
              throw new Error('insert should not be called');
            }
          });
        }
        throw new Error(`unexpected SQL: ${sql}`);
      }
    };

    const response = await submitScore(
      makeEvent(
        {
          nonce: 'nonce',
          modeId: 'blitz',
          metric: 'score',
          playerName: 'Player',
          metricValue: 12345,
          score: 12345,
          timeMs: 120000,
          lines: 0,
          pieces: 180
        },
        db
      )
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'validation-error' });
  });
});
