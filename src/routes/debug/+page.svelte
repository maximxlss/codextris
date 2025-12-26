<script lang="ts">
  import { onMount } from 'svelte';
  import { EMPTY_PRESSED } from '$lib/game/input';
  import { PIECE_INDEX, PIECE_TYPES } from '$lib/game/pieces';
  import { createRenderOptions, renderGame, type ClearBanner } from '$lib/game/render/canvas';
  import { computeRenderOptionsForStage, resizeCanvasToRenderOptions } from '$lib/game/render/layout';
  import {
    createGameState,
    updateGame,
    spawnSpinParticles,
    createEmptyBoard,
    DEFAULT_SPIN_CONFIG
  } from '$lib/game/tetris';
  import {
    BOARD_HEIGHT,
    BOARD_WIDTH,
    DEFAULT_CONFIG,
    type InputSnapshot,
    type PieceType
  } from '$lib/game/types';
  import { clamp } from '$lib/game/utils/math';

  let canvasEl: HTMLCanvasElement;
  let layoutEl: HTMLElement;
  let stageEl: HTMLDivElement;
  let ctx: CanvasRenderingContext2D | null = null;

  let renderOptions = createRenderOptions(28);
  const debugConfig = { ...DEFAULT_CONFIG, gravityMs: 999999, lockDelayMs: 999999 };
  const game = createGameState(debugConfig, undefined, undefined, 'zen');
  game.status = 'playing';
  game.active.type = 'T';
  game.active.x = 4;
  game.active.y = 4;

  let sparkPiece: PieceType = 'T';
  let sparkRotation: 0 | 1 | 2 | 3 = 0;
  let sparkX = 4;
  let sparkY = 6;
  const applyActive = () => {
    sparkX = clamp(sparkX, 0, BOARD_WIDTH - 1);
    sparkY = clamp(sparkY, 0, BOARD_HEIGHT - 1);
    game.active.type = sparkPiece;
    game.active.rotation = sparkRotation;
    game.active.x = sparkX;
    game.active.y = sparkY;
  };
  applyActive();

  const spinConfig = game.effects.spinConfig;

  const idleInput: InputSnapshot = { held: EMPTY_PRESSED, pressed: EMPTY_PRESSED };

  let clearBanner: ClearBanner | null = null;
  let autoDemo = false;
  let lastDemoAt = 0;
  let demoIndex = 0;

  const demoSequence = ['line', 'shake', 'sparks-cw', 'sparks-ccw', 'banner'] as const;

  const seedBoard = () => {
    game.board = createEmptyBoard();
    const palette = PIECE_TYPES;
    const start = BOARD_HEIGHT - 8;
    for (let y = start; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        if ((x + y) % 3 === 0) {
          const type = palette[(x + y) % palette.length] as PieceType;
          game.board[y]![x] = PIECE_INDEX[type];
        }
      }
    }
  };

  const triggerLineFlash = () => {
    game.effects.lineFlash = 1;
  };

  const triggerShake = () => {
    game.effects.shake = 1;
  };

  const triggerSparks = (dir: -1 | 0 | 1) => {
    spawnSpinParticles(game, dir);
  };

  const triggerBanner = (now: number) => {
    clearBanner = {
      title: 'SPIN',
      subtitle: 'DEBUG EFFECT',
      startedAt: now,
      duration: 2600
    };
  };

  const triggerEffect = (kind: (typeof demoSequence)[number], now: number) => {
    switch (kind) {
      case 'line':
        triggerLineFlash();
        break;
      case 'shake':
        triggerShake();
        break;
      case 'sparks-cw':
        triggerSparks(1);
        break;
      case 'sparks-ccw':
        triggerSparks(-1);
        break;
      case 'banner':
        triggerBanner(now);
        break;
    }
  };

  const updateSparkNumber =
    (key: 'sparkX' | 'sparkY') => (event: Event) => {
      const value = Number((event.target as HTMLInputElement).value);
      if (Number.isNaN(value)) return;
      if (key === 'sparkX') sparkX = value;
      if (key === 'sparkY') sparkY = value;
      applyActive();
    };

  const updateSpinConfig =
    <Key extends keyof typeof DEFAULT_SPIN_CONFIG>(key: Key) =>
    (event: Event) => {
      const value = Number((event.target as HTMLInputElement).value);
      if (Number.isNaN(value)) return;
      spinConfig[key] = value;
    };

  const resetSpinConfig = () => {
    Object.assign(spinConfig, DEFAULT_SPIN_CONFIG);
  };

  const setupCanvas = () => {
    if (!canvasEl) return;
    ctx = resizeCanvasToRenderOptions(canvasEl, renderOptions);
  };

  const updateLayout = () => {
    if (!layoutEl || !stageEl) return;
    renderOptions = computeRenderOptionsForStage(stageEl);
    setupCanvas();
  };

  onMount(() => {
    seedBoard();
    setupCanvas();
    updateLayout();

    window.addEventListener('resize', updateLayout);

    let last = performance.now();
    let accumulator = 0;
    const fixedDt = 1000 / 60;
    let rafId = 0;

    const frame = (now: number) => {
      const delta = Math.min(48, now - last);
      last = now;
      accumulator += delta;
      while (accumulator >= fixedDt) {
        updateGame(game, idleInput, fixedDt);
        accumulator -= fixedDt;
      }

      if (autoDemo && now - lastDemoAt > 1400) {
        triggerEffect(demoSequence[demoIndex]!, now);
        demoIndex = (demoIndex + 1) % demoSequence.length;
        lastDemoAt = now;
      }

      if (clearBanner && now - clearBanner.startedAt > clearBanner.duration) {
        clearBanner = null;
      }

      if (ctx) {
        renderGame(ctx, game, renderOptions, now, clearBanner);
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', updateLayout);
      cancelAnimationFrame(rafId);
    };
  });
</script>

<svelte:head>
  <title>Codextris — VFX Debug</title>
</svelte:head>

<main class="page">
  <section class="layout" bind:this={layoutEl}>
    <div class="stage" bind:this={stageEl}>
      <canvas class="board" bind:this={canvasEl} aria-label="VFX debug canvas"></canvas>
      <div class="badge">VFX DEBUG</div>
    </div>

    <aside class="side">
      <div class="header">
        <p class="kicker">CODEXTRIS</p>
        <h1>Dynamic Effects</h1>
        <p class="subtitle">Trigger and inspect VFX in isolation.</p>
      </div>

      <div class="panel">
        <h2>Triggers</h2>
        <div class="button-grid">
          <button class="ghost" on:click={triggerLineFlash}>Line flash</button>
          <button class="ghost" on:click={triggerShake}>Shake</button>
          <button class="ghost" on:click={() => triggerBanner(performance.now())}>Clear banner</button>
        </div>
      </div>

      <div class="panel">
        <h2>Spark source</h2>
        <div class="field-grid">
          <label>
            Piece
            <select bind:value={sparkPiece} on:change={applyActive}>
              {#each PIECE_TYPES as type (type)}
                <option value={type}>{type}</option>
              {/each}
            </select>
          </label>
          <label>
            Rotation
            <select bind:value={sparkRotation} on:change={applyActive}>
              <option value={0}>0°</option>
              <option value={1}>90°</option>
              <option value={2}>180°</option>
              <option value={3}>270°</option>
            </select>
          </label>
          <label>
            X
            <input
              type="number"
              min="0"
              max={BOARD_WIDTH - 1}
              value={sparkX}
              on:input={updateSparkNumber('sparkX')}
            />
          </label>
          <label>
            Y
            <input
              type="number"
              min="0"
              max={BOARD_HEIGHT - 1}
              value={sparkY}
              on:input={updateSparkNumber('sparkY')}
            />
          </label>
        </div>
        <div class="button-row">
          <button class="ghost" on:click={() => triggerSparks(1)}>Sparks (CW)</button>
          <button class="ghost" on:click={() => triggerSparks(-1)}>Sparks (CCW)</button>
          <button
            class="ghost"
            on:click={() => {
              sparkPiece = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)] as PieceType;
              sparkRotation = (Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3);
              applyActive();
            }}
          >
            Random piece
          </button>
        </div>
      </div>

      <div class="panel">
        <h2>Spin particle tuning</h2>
        <div class="field-grid">
          <label>
            Per emitter
            <input type="number" min="0" value={spinConfig.perEmitter} on:input={updateSpinConfig('perEmitter')} />
          </label>
          <label>
            Max particles
            <input type="number" min="0" value={spinConfig.maxParticles} on:input={updateSpinConfig('maxParticles')} />
          </label>
          <label>
            Speed
            <input type="number" min="0" step="0.1" value={spinConfig.speed} on:input={updateSpinConfig('speed')} />
          </label>
          <label>
            Life (ms)
            <input type="number" min="0" value={spinConfig.life} on:input={updateSpinConfig('life')} />
          </label>
          <label>
            Trail width
            <input type="number" min="0" step="0.01" value={spinConfig.size} on:input={updateSpinConfig('size')} />
          </label>
          <label>
            Drag
            <input type="number" min="0" step="0.1" value={spinConfig.drag} on:input={updateSpinConfig('drag')} />
          </label>
          <label>
            Gravity
            <input type="number" min="0" step="0.1" value={spinConfig.gravity} on:input={updateSpinConfig('gravity')} />
          </label>
          <label>
            Trail interval (ms)
            <input
              type="number"
              min="1"
              value={spinConfig.trailInterval}
              on:input={updateSpinConfig('trailInterval')}
            />
          </label>
          <label>
            Max trail points
            <input type="number" min="1" value={spinConfig.maxTrail} on:input={updateSpinConfig('maxTrail')} />
          </label>
          <label>
            Trail point life (ms)
            <input
              type="number"
              min="1"
              value={spinConfig.trailPointLife}
              on:input={updateSpinConfig('trailPointLife')}
            />
          </label>
        </div>
        <div class="button-row">
          <button class="ghost" on:click={resetSpinConfig}>Reset tuning</button>
        </div>
      </div>

      <div class="panel">
        <h2>Auto demo</h2>
        <label class="toggle">
          <input type="checkbox" bind:checked={autoDemo} />
          <span>Cycle effects every ~1.4s</span>
        </label>
        <div class="button-row">
          <button class="ghost" on:click={() => triggerEffect('line', performance.now())}>Pulse now</button>
          <button
            class="ghost"
            on:click={() => {
              seedBoard();
              game.effects.lineFlash = 0;
              game.effects.shake = 0;
              game.effects.spinParticles = [];
              clearBanner = null;
            }}
          >
            Reset scene
          </button>
        </div>
      </div>

      <div class="panel">
        <h2>Notes</h2>
        <ul>
          <li>Line flash + shake decay over time.</li>
          <li>Sparks are directional and leave trails.</li>
          <li>Banner uses the same render pipeline as gameplay.</li>
        </ul>
      </div>
    </aside>
  </section>
</main>

<style src="./+page.css"></style>

