import { describe, expect, it } from 'vitest';
import { advanceResumeCountdown, startResumeCountdown } from '../src/lib/game/ui/resume';

describe('resume countdown helpers', () => {
  it('counts down and completes', () => {
    const started = startResumeCountdown(2000, 1000);
    expect(started.deadline).toBe(3000);
    expect(started.seconds).toBe(2);

    const midway = advanceResumeCountdown(started.deadline, 2101);
    expect(midway.done).toBe(false);
    expect(midway.seconds).toBe(1);

    const finished = advanceResumeCountdown(started.deadline, 3001);
    expect(finished.done).toBe(true);
    expect(finished.seconds).toBe(0);
  });
});
