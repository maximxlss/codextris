export interface ResumeCountdownState {
  deadline: number;
  seconds: number;
}

export interface ResumeCountdownTick extends ResumeCountdownState {
  done: boolean;
}

export const startResumeCountdown = (durationMs: number, now: number): ResumeCountdownState => {
  const safeDuration = Math.max(0, durationMs);
  return {
    deadline: now + safeDuration,
    seconds: Math.ceil(safeDuration / 1000)
  };
};

export const advanceResumeCountdown = (deadline: number, now: number): ResumeCountdownTick => {
  if (!deadline) {
    return { deadline: 0, seconds: 0, done: false };
  }
  const remaining = deadline - now;
  if (remaining <= 0) {
    return { deadline: 0, seconds: 0, done: true };
  }
  return {
    deadline,
    seconds: Math.ceil(remaining / 1000),
    done: false
  };
};
