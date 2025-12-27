<script lang="ts">
  import StageOverlays from '$lib/ui/StageOverlays.svelte';
  import SidePanel from '$lib/ui/SidePanel.svelte';
  import UiModals from '$lib/ui/UiModals.svelte';
  import BackendAlerts from '$lib/ui/BackendAlerts.svelte';
  import type { GamePageController } from '$lib/ui/game-page';
  import { setGamePageContext } from '$lib/ui/game-page';
  import { CLIENT_VERSION } from '$lib/ui/page/constants';

  export let controller: GamePageController;

  setGamePageContext(controller);

  const { elements } = controller;

  let layoutEl: HTMLElement | null = null;
  let stageEl: HTMLDivElement | null = null;
  let canvasEl: HTMLCanvasElement | null = null;

  $: elements.setLayout(layoutEl);
  $: elements.setStage(stageEl);
  $: elements.setCanvas(canvasEl);

  const REPOSITORY_URL = 'https://github.com/maximxlss/codextris';

  const commitHash = (() => {
    const match = CLIENT_VERSION.match(/([a-f0-9]{7,40})$/i);
    return match ? match[1] : null;
  })();

  const versionLink = commitHash ? `${REPOSITORY_URL}/tree/${commitHash}` : REPOSITORY_URL;
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
  <div class="floating-meta">
    <a
      class="github-icon"
      href={REPOSITORY_URL}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Open Codextris on GitHub"
    >
      <img src="/github-mark-white.svg" alt="GitHub" />
    </a>
    <a class="version-link" href={versionLink} target="_blank" rel="noreferrer noopener">
      {CLIENT_VERSION}
    </a>
  </div>
</main>
