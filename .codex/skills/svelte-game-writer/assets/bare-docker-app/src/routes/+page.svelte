<script lang="ts">
  const headline: string = 'It runs in Docker.';
</script>

<svelte:head>
  <title>SvelteKit Bare Docker</title>
</svelte:head>

<main>
  <h1>{headline}</h1>
  <p>Replace this page with your game.</p>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    background: #0f1115;
    color: #e6e8eb;
  }

  main {
    min-height: 100vh;
    display: grid;
    place-items: center;
    gap: 0.5rem;
    text-align: center;
  }

  h1 {
    font-size: 2rem;
    margin: 0;
  }

  p {
    margin: 0;
    opacity: 0.8;
  }
</style>
