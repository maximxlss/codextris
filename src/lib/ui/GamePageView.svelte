<script lang="ts">
  import StageOverlays from '$lib/ui/StageOverlays.svelte';
  import SidePanel from '$lib/ui/SidePanel.svelte';
  import UiModals from '$lib/ui/UiModals.svelte';
  import BackendAlerts from '$lib/ui/BackendAlerts.svelte';
  import type { GamePageController } from '$lib/ui/game-page';
  import { setGamePageContext } from '$lib/ui/game-page';

  export let controller: GamePageController;

  setGamePageContext(controller);

  const { elements } = controller;

  let layoutEl: HTMLElement | null = null;
  let stageEl: HTMLDivElement | null = null;
  let canvasEl: HTMLCanvasElement | null = null;

  $: elements.setLayout(layoutEl);
  $: elements.setStage(stageEl);
  $: elements.setCanvas(canvasEl);
</script>

<main class="page">
  <section class="layout" bind:this={layoutEl}>
    <div class="stage" bind:this={stageEl}>
      <canvas class="board" bind:this={canvasEl} aria-label="Tetris game"></canvas>
      <StageOverlays />
    </div>
    <SidePanel />
  </section>
  <BackendAlerts />
  <UiModals />
</main>
