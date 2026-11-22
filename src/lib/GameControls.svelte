<script lang="ts">
  import { game, RUN_LENGTH } from '../game/gameState.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    onAdvance: () => void;
  }

  let { onAdvance }: Props = $props();

  const canTrace = $derived(game.phase === 'aim' && game.ink > 0 && !game.previewActive);
  const finished = $derived(
    game.lives <= 0 || (game.mode === 'notebook' && game.round >= RUN_LENGTH),
  );
  const actionLabel = $derived(
    game.phase === 'study'
      ? 'Aim'
      : game.phase === 'aim'
        ? 'Fire'
        : game.phase === 'firing'
          ? 'Firing'
          : finished
            ? 'Finish'
            : 'Next page',
  );
</script>

<aside class="rail rail-right">
  <div class="ink" aria-label={`${game.ink} of ${game.maxInk} ink left`}>
    <span class="pips" aria-hidden="true">
      {#each Array(game.maxInk) as _, index}
        <span class="pip" class:is-empty={index >= game.ink}></span>
      {/each}
    </span>
    <button
      class="trace"
      type="button"
      onclick={() => game.useInk()}
      disabled={!canTrace}
      title={canTrace ? 'Trace the full reflected line (I)' : 'No ink to spend'}
    >
      <Icon name="ink" size={16} />
      Trace
    </button>
  </div>

  <button class="action" type="button" onclick={onAdvance} disabled={game.phase === 'firing'}>
    {#if game.phase === 'aim'}
      <Icon name="fire" size={22} />
    {:else if game.phase === 'reveal'}
      <Icon name="next" size={22} />
    {:else if game.phase === 'study'}
      <Icon name="play" size={20} />
    {:else}
      <Icon name="fire" size={22} />
    {/if}
    {actionLabel}
  </button>

  <p class="keys" aria-hidden="true">Right-click / Space</p>
</aside>

<style>
  .rail-right {
    position: fixed;
    z-index: 11;
    right: clamp(10px, 1.8vw, 22px);
    bottom: clamp(12px, 2.4vh, 22px);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .ink {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 7px 5px 11px;
    border: 1px solid rgba(247, 235, 208, 0.2);
    border-radius: 2px;
    background: rgba(28, 19, 11, 0.74);
  }

  .pips {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .pip {
    width: 8px;
    height: 12px;
    border-radius: 50% 50% 46% 54% / 62% 62% 38% 38%;
    background: #9dc3da;
    box-shadow: inset 0 -2px 3px rgba(0, 0, 0, 0.25);
  }

  .pip.is-empty {
    background: transparent;
    border: 1.5px solid rgba(247, 235, 208, 0.4);
    box-shadow: none;
  }

  .trace {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 34px;
    padding: 0 10px;
    border: 1px solid rgba(247, 235, 208, 0.34);
    border-radius: 2px;
    background: transparent;
    color: #fbf3e1;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease,
      opacity 0.15s ease;
  }

  .trace:hover:not(:disabled) {
    border-color: #fbf3e1;
    background: rgba(251, 243, 225, 0.12);
  }

  .trace:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-width: 196px;
    min-height: 68px;
    padding: 0 26px;
    border: 2px solid #1b2832;
    border-radius: 3px;
    background: #fbf4e3;
    color: #1b2832;
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    box-shadow: 5px 6px 0 rgba(12, 8, 5, 0.55);
    transition:
      transform 0.12s ease,
      box-shadow 0.12s ease,
      background-color 0.12s ease;
  }

  .action:hover:not(:disabled) {
    background: #fffdf6;
    transform: translate(-1px, -2px);
    box-shadow: 7px 8px 0 rgba(12, 8, 5, 0.55);
  }

  .action:active:not(:disabled) {
    transform: translate(3px, 3px);
    box-shadow: 1px 2px 0 rgba(12, 8, 5, 0.55);
  }

  .action:disabled {
    cursor: default;
    opacity: 0.72;
  }

  .keys {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: rgba(251, 243, 225, 0.62);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  }

  @media (max-width: 720px) {
    .rail-right {
      left: 10px;
      right: 10px;
      align-items: stretch;
    }

    .ink {
      justify-content: flex-end;
      align-self: flex-end;
    }

    .action {
      width: 100%;
      min-height: 64px;
      font-size: 1.4rem;
    }

    .keys {
      display: none;
    }
  }
</style>
