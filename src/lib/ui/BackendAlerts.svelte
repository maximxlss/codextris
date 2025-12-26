<script lang="ts">
  type BackendAlert = { id: number; title: string; message: string };

  export let alerts: BackendAlert[] = [];
  export let onDismiss: (id: number) => void;
</script>

{#if alerts.length > 0}
  <div class="backend-alerts" role="status" aria-live="polite">
    <div class="backend-alert-stack">
      {#each alerts as alert, index (alert.id)}
        <div
          class="backend-alert-card"
          style={`--stack-offset: ${index * 8}px; --stack-index: ${index}`}
          role="button"
          tabindex="0"
          on:click={() => onDismiss(alert.id)}
          on:keydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onDismiss(alert.id);
            }
          }}
        >
          <div class="backend-alert-title">{alert.title}</div>
          <div class="backend-alert-message">
            <span class="backend-alert-label">Error</span>
            <code>{alert.message}</code>
          </div>
          <button class="primary" on:click|stopPropagation={() => onDismiss(alert.id)}>
            Acknowledge
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  button {
    border: none;
    border-radius: var(--radius-md);
    padding: 0.65rem 1.1rem;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.02em;
    cursor: pointer;
    font-family: inherit;
    color: var(--ink);
    background: transparent;
    border: 1px solid transparent;
    min-height: 44px;
  }

  button:focus-visible {
    outline: 2px solid rgba(77, 235, 255, 0.9);
    outline-offset: 2px;
  }

  .primary {
    background: var(--accent);
    color: #041018;
    border: 1px solid transparent;
  }

  .backend-alerts {
    position: fixed;
    right: 1.25rem;
    bottom: 1.25rem;
    z-index: 20;
    pointer-events: none;
  }

  .backend-alert-stack {
    display: grid;
    gap: 0.9rem;
    width: min(92vw, 420px);
    justify-items: end;
  }

  .backend-alert-card {
    padding: 1.4rem 1.5rem;
    border-radius: 18px;
    border: 1px solid rgba(255, 107, 107, 0.9);
    background:
      linear-gradient(130deg, rgba(255, 107, 107, 0.2), rgba(77, 235, 255, 0.12)),
      rgba(10, 14, 24, 0.95);
    box-shadow:
      0 0 0 1px rgba(255, 107, 107, 0.35),
      0 20px 60px rgba(6, 10, 18, 0.7),
      0 0 40px rgba(255, 107, 107, 0.35);
    text-align: center;
    cursor: pointer;
    transform: translateY(var(--stack-offset, 0px));
    animation: alertPulse 1.4s ease-in-out infinite;
    animation-delay: calc(var(--stack-index, 0) * 0.08s);
    pointer-events: auto;
  }

  .backend-alert-title {
    font-family: 'Chakra Petch', sans-serif;
    font-size: 1.25rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.6rem;
  }

  .backend-alert-message {
    display: grid;
    gap: 0.45rem;
    margin: 0 0 1rem;
    text-align: left;
  }

  .backend-alert-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255, 255, 255, 0.6);
  }

  .backend-alert-message code {
    display: block;
    padding: 0.65rem 0.75rem;
    border-radius: 12px;
    background: rgba(5, 8, 16, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--ink-soft);
    font-family: 'JetBrains Mono', 'SFMono-Regular', 'Menlo', monospace;
    font-size: 0.9rem;
    line-height: 1.4;
    word-break: break-word;
  }

  .backend-alert-card button {
    min-width: 160px;
  }

  @keyframes alertPulse {
    0% {
      transform: scale(1);
      box-shadow:
        0 0 0 1px rgba(255, 107, 107, 0.35),
        0 20px 60px rgba(6, 10, 18, 0.7),
        0 0 30px rgba(255, 107, 107, 0.3);
    }
    50% {
      transform: scale(1.01);
      box-shadow:
        0 0 0 1px rgba(255, 107, 107, 0.7),
        0 24px 70px rgba(6, 10, 18, 0.75),
        0 0 60px rgba(255, 107, 107, 0.5);
    }
    100% {
      transform: scale(1);
      box-shadow:
        0 0 0 1px rgba(255, 107, 107, 0.35),
        0 20px 60px rgba(6, 10, 18, 0.7),
        0 0 30px rgba(255, 107, 107, 0.3);
    }
  }
</style>
