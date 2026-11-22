<script lang="ts">
  import Icon from './Icon.svelte';

  import { game } from '../game/gameState.svelte';

  interface Props {
    onResume: () => void;
    onReplay: () => void;
    onEndRun: () => void;
    onHome: () => void;
  }

  let { onResume, onReplay, onEndRun, onHome }: Props = $props();
</script>

<div class="veil" role="presentation">
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="exit-title">
    <h2 id="exit-title">Leave the field?</h2>

    <div class="actions">
      <button class="btn btn-primary wide" type="button" onclick={onResume}>
        <Icon name="play" size={17} />
        Keep playing
      </button>
      <button class="btn" type="button" onclick={onReplay}>Replay game</button>
      {#if game.mode === 'endless'}
        <button class="btn" type="button" onclick={onEndRun}>End run</button>
      {:else}
        <button class="btn btn-quiet" type="button" onclick={onHome}>Home</button>
      {/if}
    </div>

    <p class="hint"><span class="key">Esc</span> closes this</p>
  </div>
</div>

<style>
  .veil {
    position: fixed;
    inset: 0;
    z-index: 65;
    display: grid;
    place-items: center;
    padding: 16px;
    overflow-y: auto;
    background: rgba(8, 6, 4, 0.74);
    backdrop-filter: blur(3px);
  }

  .sheet {
    width: min(100%, 400px);
    padding: clamp(20px, 3.6vw, 28px);
    background: var(--color-paper);
    color: var(--color-ink);
    border: 1px solid var(--color-ink-soft);
    box-shadow:
      0 40px 80px -30px rgba(0, 0, 0, 0.85),
      0 6px 16px rgba(0, 0, 0, 0.3);
    animation: var(--animate-pop-in);
  }

  h2 {
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-ink);
    font-family: var(--font-display);
    font-size: clamp(1.7rem, 4.6vw, 2.1rem);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 16px;
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

  .hint {
    margin-top: 14px;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--color-ink-soft);
  }

  @media (max-width: 400px) {
    .actions {
      grid-template-columns: 1fr;
    }
  }
</style>
