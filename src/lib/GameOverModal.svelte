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
  const title = $derived(
    won ? 'Notebook complete' : game.mode === 'endless' ? 'Run over' : 'Out of mistakes',
  );
  const modeLine = $derived(
    `${game.mode === 'endless' ? 'Endless' : 'Notebook'} · page ${game.round} · difficulty ${game.difficulty}/5`,
  );

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

<div class="veil">
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="end-title">
    <header class="head">
      <h2 id="end-title">{title}</h2>
      <p class="meta">{modeLine}</p>
    </header>

    <div class="score">
      <span class="score-label">Score</span>
      <strong>{game.score.toLocaleString()}</strong>
    </div>

    <dl class="stats">
      <div>
        <dt>Burn rate</dt>
        <dd>{game.totalTargets > 0 ? Math.round((game.totalHits / game.totalTargets) * 100) : 0}%</dd>
      </div>
      <div>
        <dt>Best grade</dt>
        <dd>{'★'.repeat(game.bestStars) || 'none'}</dd>
      </div>
      <div>
        <dt>Ink used</dt>
        <dd>{game.totalInkUsed}</dd>
      </div>
    </dl>

    <div class="code-row">
      <span class="code-label">Run code</span>
      <code>{game.runSeed || 'none'}</code>
      <button
        class="copy"
        type="button"
        onclick={copyCode}
        disabled={!game.runSeed}
        title="Copy run code"
        aria-label={copied ? 'Run code copied' : 'Copy run code'}
      >
        <Icon name={copied ? 'check' : 'copy'} size={17} />
      </button>
    </div>
    <p class="sr-only" aria-live="polite">{copied ? 'Run code copied' : ''}</p>

    <div class="actions">
      <button class="btn btn-primary wide" type="button" onclick={onRetry}>
        <Icon name="play" size={17} />
        Replay this run
      </button>
      <button class="btn" type="button" onclick={onNewRun}>New run</button>
      <button class="btn btn-quiet" type="button" onclick={onMenu}>Home</button>
    </div>
  </div>
</div>

<style>
  .veil {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    padding: 16px;
    overflow-y: auto;
    background: rgba(8, 6, 4, 0.74);
    backdrop-filter: blur(3px);
  }

  .sheet {
    width: min(100%, 460px);
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
    padding: clamp(20px, 3.6vw, 30px);
    background: var(--color-paper);
    color: var(--color-ink);
    border: 1px solid var(--color-ink-soft);
    box-shadow:
      0 40px 80px -30px rgba(0, 0, 0, 0.85),
      0 6px 16px rgba(0, 0, 0, 0.3);
    animation: var(--animate-pop-in);
  }

  .head {
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-ink);
  }

  .head h2 {
    font-family: var(--font-display);
    font-size: clamp(1.9rem, 5vw, 2.5rem);
    font-weight: 800;
    line-height: 1.02;
    letter-spacing: -0.035em;
  }

  .meta {
    margin-top: 4px;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-ink-soft);
  }

  .score {
    display: grid;
    gap: 2px;
    padding: 14px 0 12px;
  }

  .score-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-ink-soft);
  }

  .score strong {
    font-family: var(--font-mono);
    font-size: clamp(2.6rem, 9vw, 3.6rem);
    line-height: 1;
    letter-spacing: -0.06em;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 0;
    padding: 12px 0;
    border-top: 1px dashed var(--color-rule);
    border-bottom: 1px dashed var(--color-rule);
  }

  .stats div {
    display: grid;
    gap: 2px;
  }

  .stats dt {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-ink-soft);
  }

  .stats dd {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--color-ink);
  }

  .code-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
  }

  .code-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-ink-soft);
  }

  .code-row code {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.16em;
  }

  .copy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid var(--color-paper-edge);
    border-radius: 2px;
    background: transparent;
    color: var(--color-ink-soft);
  }

  .copy:hover:not(:disabled) {
    border-color: var(--color-ink);
    color: var(--color-ink);
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 4px;
  }

  .actions .wide {
    grid-column: 1 / -1;
    min-height: 52px;
    font-size: 1rem;
  }

  .actions .btn {
    min-height: 46px;
    font-size: 0.875rem;
  }

  @media (max-width: 420px) {
    .stats {
      grid-template-columns: 1fr 1fr;
    }

    .actions {
      grid-template-columns: 1fr;
    }
  }
</style>
