# Dynamic Effects Patterns

Prefer effects that are GPU-friendly (transform/opacity) and easy to disable with reduced motion.

## Glow pulse

```css
.glow {
  box-shadow: 0 0 24px rgba(78, 227, 163, 0.35);
  animation: glow-pulse 2.4s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 18px rgba(78, 227, 163, 0.25); }
  50% { box-shadow: 0 0 30px rgba(78, 227, 163, 0.6); }
}
```

## Gradient drift background

```css
.backdrop {
  background: radial-gradient(1200px 600px at 20% 10%, #16324a, transparent),
              radial-gradient(800px 500px at 80% 20%, #2b1f4f, transparent),
              #0b0f14;
  animation: drift 16s ease-in-out infinite alternate;
}

@keyframes drift {
  0% { background-position: 0% 0%, 100% 0%, 0 0; }
  100% { background-position: 10% 10%, 90% 15%, 0 0; }
}
```

## Scanline overlay

```css
.scanlines::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.04),
    rgba(255, 255, 255, 0.04) 1px,
    transparent 1px,
    transparent 3px
  );
  mix-blend-mode: soft-light;
}
```

## Parallax layer drift

Use a slow translate on large background shapes.

```css
.layer {
  position: absolute;
  inset: -10% -10% auto auto;
  width: 60vmin;
  height: 60vmin;
  opacity: 0.25;
  animation: float 14s ease-in-out infinite alternate;
}

@keyframes float {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-18px, 12px, 0); }
}
```

## State-driven accent flash (Svelte)

Use a store to drive a short-lived accent flash on key events.

```svelte
<script lang="ts">
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  const flash = tweened(0, { duration: 300, easing: cubicOut });

  function triggerFlash() {
    flash.set(1);
    setTimeout(() => flash.set(0), 120);
  }
</script>

<div class="accent" style:opacity={$flash}></div>
```

## Reduced motion guard

```css
@media (prefers-reduced-motion: reduce) {
  .glow, .backdrop, .layer { animation: none; }
}
```
