<script lang="ts">
  import { onMount, tick } from 'svelte';
  import GamePageView from '$lib/ui/GamePageView.svelte';
  import '$lib/ui/GamePageView.css';
  import { createGamePageController } from '$lib/ui/game-page';

  const controller = createGamePageController();
  onMount(() => {
    let cleanup: (() => void) | null = null;
    let active = true;
    void tick().then(() => {
      if (!active) return;
      cleanup = controller.init();
    });
    return () => {
      active = false;
      cleanup?.();
    };
  });
</script>

<svelte:head>
  <title>Codextris — Neon Tetris</title>
</svelte:head>

<GamePageView {controller} />
