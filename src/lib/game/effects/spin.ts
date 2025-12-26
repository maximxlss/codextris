import type { GameState, LockResultKind, PieceType, SpinParticleConfig } from '../types';
import { collides, isCellOccupied } from '../physics/collision';

type CornerEmitter = { px: number; py: number; dirX: -1 | 0 | 1; dirY: -1 | 0 | 1 };

const CORNER_EMITTERS: Record<PieceType, CornerEmitter[][]> = {
  I: [
    [
      { px: -1, py: 0, dirX: 1, dirY: 0 },
      { px: 3, py: 0, dirX: 0, dirY: 1 },
      { px: 3, py: 1, dirX: -1, dirY: 0 },
      { px: -1, py: 1, dirX: 0, dirY: -1 }
    ],
    [
      { px: 1, py: -1, dirX: 1, dirY: 0 },
      { px: 2, py: -1, dirX: 0, dirY: 1 },
      { px: 2, py: 3, dirX: -1, dirY: 0 },
      { px: 1, py: 3, dirX: 0, dirY: -1 }
    ],
    [
      { px: -1, py: 1, dirX: 1, dirY: 0 },
      { px: 3, py: 1, dirX: 0, dirY: 1 },
      { px: 3, py: 2, dirX: -1, dirY: 0 },
      { px: -1, py: 2, dirX: 0, dirY: -1 }
    ],
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 1, py: -1, dirX: 0, dirY: 1 },
      { px: 1, py: 3, dirX: -1, dirY: 0 },
      { px: 0, py: 3, dirX: 0, dirY: -1 }
    ]
  ],
  O: [
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 2, py: -1, dirX: 0, dirY: 1 },
      { px: 2, py: 1, dirX: -1, dirY: 0 },
      { px: 0, py: 1, dirX: 0, dirY: -1 }
    ],
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 2, py: -1, dirX: 0, dirY: 1 },
      { px: 2, py: 1, dirX: -1, dirY: 0 },
      { px: 0, py: 1, dirX: 0, dirY: -1 }
    ],
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 2, py: -1, dirX: 0, dirY: 1 },
      { px: 2, py: 1, dirX: -1, dirY: 0 },
      { px: 0, py: 1, dirX: 0, dirY: -1 }
    ],
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 2, py: -1, dirX: 0, dirY: 1 },
      { px: 2, py: 1, dirX: -1, dirY: 0 },
      { px: 0, py: 1, dirX: 0, dirY: -1 }
    ]
  ],
  J: [
    [
      { px: -1, py: -1, dirX: 1, dirY: 0 },
      { px: 0, py: -1, dirX: 0, dirY: 1 },
      { px: 2, py: 1, dirX: -1, dirY: 0 },
      { px: -1, py: 1, dirX: 0, dirY: -1 }
    ],
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 2, py: -1, dirX: 0, dirY: 1 },
      { px: 1, py: 2, dirX: -1, dirY: 0 },
      { px: 0, py: 2, dirX: 0, dirY: -1 }
    ],
    [
      { px: -1, py: 0, dirX: 1, dirY: 0 },
      { px: 2, py: 0, dirX: 0, dirY: 1 },
      { px: 2, py: 2, dirX: -1, dirY: 0 },
      { px: 1, py: 2, dirX: 0, dirY: -1 }
    ],
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 1, py: -1, dirX: 0, dirY: 1 },
      { px: 1, py: 2, dirX: -1, dirY: 0 },
      { px: -1, py: 2, dirX: 0, dirY: -1 }
    ]
  ],
  L: [
    [
      { px: 1, py: -1, dirX: 1, dirY: 0 },
      { px: 2, py: -1, dirX: 0, dirY: 1 },
      { px: 2, py: 1, dirX: -1, dirY: 0 },
      { px: -1, py: 1, dirX: 0, dirY: -1 }
    ],
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 1, py: -1, dirX: 0, dirY: 1 },
      { px: 2, py: 2, dirX: -1, dirY: 0 },
      { px: 0, py: 2, dirX: 0, dirY: -1 }
    ],
    [
      { px: -1, py: 0, dirX: 1, dirY: 0 },
      { px: 2, py: 0, dirX: 0, dirY: 1 },
      { px: 0, py: 2, dirX: -1, dirY: 0 },
      { px: -1, py: 2, dirX: 0, dirY: -1 }
    ],
    [
      { px: -1, py: -1, dirX: 1, dirY: 0 },
      { px: 1, py: -1, dirX: 0, dirY: 1 },
      { px: 1, py: 2, dirX: -1, dirY: 0 },
      { px: 0, py: 2, dirX: 0, dirY: -1 }
    ]
  ],
  S: [
    [
      { px: -1, py: -1, dirX: 1, dirY: 0 },
      { px: 1, py: -1, dirX: 0, dirY: 1 },
      { px: 2, py: 1, dirX: -1, dirY: 0 },
      { px: 0, py: 1, dirX: 0, dirY: -1 }
    ],
    [
      { px: 1, py: -1, dirX: 1, dirY: 0 },
      { px: 2, py: -1, dirX: 0, dirY: 1 },
      { px: 1, py: 2, dirX: -1, dirY: 0 },
      { px: 0, py: 2, dirX: 0, dirY: -1 }
    ],
    [
      { px: -1, py: 0, dirX: 1, dirY: 0 },
      { px: 1, py: 0, dirX: 0, dirY: 1 },
      { px: 2, py: 2, dirX: -1, dirY: 0 },
      { px: 0, py: 2, dirX: 0, dirY: -1 }
    ],
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 1, py: -1, dirX: 0, dirY: 1 },
      { px: 0, py: 2, dirX: -1, dirY: 0 },
      { px: -1, py: 2, dirX: 0, dirY: -1 }
    ]
  ],
  T: [
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 1, py: -1, dirX: 0, dirY: 1 },
      { px: 2, py: 1, dirX: -1, dirY: 0 },
      { px: -1, py: 1, dirX: 0, dirY: -1 }
    ],
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 1, py: -1, dirX: 0, dirY: 1 },
      { px: 1, py: 2, dirX: -1, dirY: 0 },
      { px: 0, py: 2, dirX: 0, dirY: -1 }
    ],
    [
      { px: -1, py: 0, dirX: 1, dirY: 0 },
      { px: 2, py: 0, dirX: 0, dirY: 1 },
      { px: 1, py: 2, dirX: -1, dirY: 0 },
      { px: 0, py: 2, dirX: 0, dirY: -1 }
    ],
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 1, py: -1, dirX: 0, dirY: 1 },
      { px: 1, py: 2, dirX: -1, dirY: 0 },
      { px: 0, py: 2, dirX: 0, dirY: -1 }
    ]
  ],
  Z: [
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 2, py: -1, dirX: 0, dirY: 1 },
      { px: 1, py: 1, dirX: -1, dirY: 0 },
      { px: -1, py: 1, dirX: 0, dirY: -1 }
    ],
    [
      { px: 0, py: -1, dirX: 1, dirY: 0 },
      { px: 1, py: -1, dirX: 0, dirY: 1 },
      { px: 2, py: 2, dirX: -1, dirY: 0 },
      { px: 1, py: 2, dirX: 0, dirY: -1 }
    ],
    [
      { px: 0, py: 0, dirX: 1, dirY: 0 },
      { px: 2, py: 0, dirX: 0, dirY: 1 },
      { px: 1, py: 2, dirX: -1, dirY: 0 },
      { px: -1, py: 2, dirX: 0, dirY: -1 }
    ],
    [
      { px: -1, py: -1, dirX: 1, dirY: 0 },
      { px: 0, py: -1, dirX: 0, dirY: 1 },
      { px: 1, py: 2, dirX: -1, dirY: 0 },
      { px: 0, py: 2, dirX: 0, dirY: -1 }
    ]
  ]
};

export const DEFAULT_SPIN_CONFIG: SpinParticleConfig = {
  perEmitter: 1,
  maxParticles: 140,
  speed: 5.0,
  life: 400,
  size: 0.06,
  drag: 0.5,
  gravity: 20,
  trailInterval: 26,
  maxTrail: 100,
  trailPointLife: 150
};

export const detectSpin = (state: GameState): { kind: LockResultKind; spinType?: PieceType } => {
  if (!state.lastMoveWasRotation) {
    return { kind: 'none' };
  }

  const type = state.active.type;
  const cx = state.active.x;
  const cy = state.active.y;

  if (type === 'T') {
    const corners = [
      { x: cx - 1, y: cy - 1 },
      { x: cx + 1, y: cy - 1 },
      { x: cx - 1, y: cy + 1 },
      { x: cx + 1, y: cy + 1 }
    ];
    let blocked = 0;
    for (const corner of corners) {
      if (isCellOccupied(state, corner.x, corner.y)) {
        blocked += 1;
      }
    }
    if (blocked >= 3) {
      const rotation = state.active.rotation;
      const frontCorners =
        rotation === 0
          ? [
              { x: cx - 1, y: cy - 1 },
              { x: cx + 1, y: cy - 1 }
            ]
          : rotation === 1
            ? [
                { x: cx + 1, y: cy - 1 },
                { x: cx + 1, y: cy + 1 }
              ]
            : rotation === 2
              ? [
                  { x: cx - 1, y: cy + 1 },
                  { x: cx + 1, y: cy + 1 }
                ]
              : [
                  { x: cx - 1, y: cy - 1 },
                  { x: cx - 1, y: cy + 1 }
                ];
      const [frontA, frontB] = frontCorners;
      if (!frontA || !frontB) {
        return { kind: 'none' };
      }
      const frontBlocked =
        (isCellOccupied(state, frontA.x, frontA.y) ? 1 : 0) +
        (isCellOccupied(state, frontB.x, frontB.y) ? 1 : 0);
      return frontBlocked === 2 ? { kind: 'tspin', spinType: 'T' } : { kind: 'tspin-mini', spinType: 'T' };
    }
    return { kind: 'none' };
  }

  if (type !== 'O') {
    const immobile =
      collides(state, state.active, -1, 0) &&
      collides(state, state.active, 1, 0) &&
      collides(state, state.active, 0, 1) &&
      collides(state, state.active, 0, -1);
    if (immobile) {
      return { kind: 'spin', spinType: type };
    }
    const kick = state.lastRotationKick;
    if (kick && kick.x !== 0) {
      const semiImmobile = collides(state, state.active, -1, 0) && collides(state, state.active, 1, 0);
      if (semiImmobile) {
        return { kind: 'spin-mini', spinType: type };
      }
    }
  }

  return { kind: 'none' };
};

export const spawnSpinParticles = (state: GameState, rotationDir: -1 | 0 | 1): void => {
  const config = state.effects.spinConfig;
  const emitters = CORNER_EMITTERS[state.active.type]?.[state.active.rotation] ?? [];
  if (emitters.length === 0) return;
  const requested = Math.max(0, Math.floor(config.perEmitter)) * emitters.length;
  const available = Math.max(0, config.maxParticles - state.effects.spinParticles.length);
  const count = Math.min(requested, available);
  if (count <= 0) return;
  const speedJitter = 0.35;
  const lifeJitter = 0.3;
  const sizeJitter = 0.4;
  for (let i = 0; i < count; i += 1) {
    const emitter = emitters[i % emitters.length]!;
    const ox = state.active.x + emitter.px;
    const oy = state.active.y + emitter.py;
    let dirX = emitter.dirX;
    let dirY = emitter.dirY;
    if (rotationDir === 1) {
      dirX = -dirX as -1 | 0 | 1;
      dirY = -dirY as -1 | 0 | 1;
    } else if (rotationDir === 0 && Math.random() < 0.5) {
      dirX = -dirX as -1 | 0 | 1;
      dirY = -dirY as -1 | 0 | 1;
    }
    const speed = config.speed * (1 + (Math.random() * 2 - 1) * speedJitter);
    const life = config.life * (1 + (Math.random() * 2 - 1) * lifeJitter);
    state.effects.spinParticles.push({
      x: ox,
      y: oy,
      vx: dirX * speed,
      vy: dirY * speed,
      size: config.size * (1 + (Math.random() * 2 - 1) * sizeJitter),
      trail: [{ x: ox, y: oy, life: config.trailPointLife, ttl: config.trailPointLife }],
      trailTimer: 0,
      life,
      ttl: life
    });
  }
  if (state.effects.spinParticles.length > config.maxParticles) {
    state.effects.spinParticles.splice(0, state.effects.spinParticles.length - config.maxParticles);
  }
};

export const updateSpinParticles = (state: GameState, dt: number): void => {
  if (dt <= 0 || state.effects.spinParticles.length === 0) return;
  const step = dt / 1000;
  const config = state.effects.spinConfig;
  const drag = Math.max(0, 1 - step * Math.max(0, config.drag));
  const gravity = config.gravity;
  const trailInterval = Math.max(6, config.trailInterval);
  const maxTrail = Math.max(4, config.maxTrail);
  const trailPointLife = Math.max(60, config.trailPointLife);
  for (let i = state.effects.spinParticles.length - 1; i >= 0; i -= 1) {
    const particle = state.effects.spinParticles[i]!;
    particle.life -= dt;
    const alive = particle.life > 0;
    if (alive) {
      particle.vx *= drag;
      particle.vy = particle.vy * drag + gravity * step;
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      particle.trailTimer += dt;
      if (particle.trailTimer >= trailInterval) {
        particle.trailTimer -= trailInterval;
        particle.trail.push({ x: particle.x, y: particle.y, life: trailPointLife, ttl: trailPointLife });
      }
    }
    if (particle.trail.length > 0) {
      for (let t = particle.trail.length - 1; t >= 0; t -= 1) {
        const point = particle.trail[t]!;
        point.life -= dt;
        if (point.life <= 0) {
          particle.trail.splice(t, 1);
        }
      }
    }
    if (particle.trail.length > maxTrail) {
      particle.trail.splice(0, particle.trail.length - maxTrail);
    }
    if (!alive && particle.trail.length === 0) {
      state.effects.spinParticles.splice(i, 1);
    }
  }
};
