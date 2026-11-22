<script lang="ts">
  import { game } from '../game/gameState.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    onRetry: () => void;
    onNewRun: () => void;
    onMenu: () => void;
  }

  let { onRetry, onNewRun, onMenu }: Props = $props();

  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  const won = $derived(game.phase === 'victory');

  async function copyCode() {
    if (!game.runSeed) return;
    try {
      await navigator.clipboard.writeText(game.runSeed);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 1800);
    } catch {
      copied = false;
    }
  }
</script>

<div class="modal-veil">
  <div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="run-end-title">
    <h2 id="run-end-title">{won ? 'Notebook complete' : 'Game over'}</h2>

    <div class="final-score">
      <span class="label">Score</span>
      <strong>{game.score.toLocaleString()}</strong>
    </div>

    <div class="run-code">
      <div>
        <span class="label">Run code</span>
        <code>{game.runSeed || 'none'}</code>
      </div>
      <button
        class="icon-btn"
        type="button"
        onclick={copyCode}
        title="Copy run code"
        aria-label={copied ? 'Run code copied' : 'Copy run code'}
        disabled={!game.runSeed}
      >
        <Icon name={copied ? 'check' : 'copy'} size={18} />
      </button>
    </div>
    <p class="sr-only" aria-live="polite">{copied ? 'Run code copied to clipboard' : ''}</p>

    <div class="modal-actions">
      <button class="btn btn-primary modal-primary" type="button" onclick={onRetry}>
        <Icon name="play" size={17} />
        Replay
      </button>
      <button class="btn" type="button" onclick={onNewRun}>
        New notebook
      </button>
      <button class="btn btn-quiet" type="button" onclick={onMenu}>
        Cover
      </button>
    </div>
  </div>
</div>

<style>
  .modal-veil {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    padding: 16px;
    overflow-y: auto;
    background: rgba(8, 6, 4, 0.72);
    backdrop-filter: blur(3px);
  }

  .modal-sheet {
    width: min(100%, 500px);
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
    padding: clamp(22px, 4vw, 34px);
    background: var(--color-paper);
    background-image: repeating-linear-gradient(0deg, transparent 0 33px, rgba(27, 40, 50, 0.024) 33px 34px);
    border: 1px solid var(--color-ink-soft);
    box-shadow:
      0 40px 80px -30px rgba(0, 0, 0, 0.85),
      0 6px 16px rgba(0, 0, 0, 0.3);
    animation: var(--animate-pop-in);
  }

  .modal-sheet h2 {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5.4vw, 2.8rem);
    font-weight: 800;
    line-height: 1.02;
    letter-spacing: -0.04em;
  }

  .final-score {
    display: grid;
    gap: 2px;
    margin-top: 14px;
    padding: 14px 0;
    border-top: 1px solid var(--color-ink);
    border-bottom: 1px dashed var(--color-rule);
  }

  .final-score strong {
    font-family: var(--font-mono);
    font-size: clamp(2.4rem, 8vw, 3.4rem);
    line-height: 1;
    letter-spacing: -0.06em;
  }

  .run-code {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-top: 16px;
    padding: 10px 12px;
    border: 1px dashed var(--color-ink-faint);
  }

  .run-code code {
    display: block;
    margin-top: 2px;
    font-family: var(--font-mono);
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--color-ink);
  }

  .modal-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 16px;
  }

  .modal-primary {
    grid-column: 1 / -1;
    min-height: 54px;
  }

  .modal-actions .btn-quiet {
    grid-column: 1 / -1;
  }

  @media (max-width: 460px) {
    .modal-actions {
      grid-template-columns: 1fr;
    }

    .modal-primary,
    .modal-actions .btn-quiet {
      grid-column: auto;
    }
  }
</style>
