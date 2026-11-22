<script lang="ts">
  import { game, RUN_LENGTH } from '../game/gameState.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    onAdvance: () => void;
  }

  let { onAdvance }: Props = $props();

  const finished = $derived(
    game.mode === 'notebook' && (game.lives <= 0 || game.round >= RUN_LENGTH),
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
            : 'Next',
  );
</script>

<aside class="rail rail-right">
  <p class="keys" aria-hidden="true">Left click / Space</p>

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
</aside>

<style>
  .rail-right {
    position: fixed;
    z-index: 11;
    right: clamp(10px, 1.8vw, 22px);
    bottom: clamp(10px, 2vh, 20px);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    width: 148px;
  }

  .keys {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    border: 1px solid rgba(247, 235, 208, 0.2);
    border-radius: 2px;
    background: rgba(28, 19, 11, 0.74);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #fbf3e1;
  }

  .action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 60px;
    border: 2px solid #1b2832;
    border-radius: 2px;
    background: #fbf4e3;
    color: #1b2832;
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    box-shadow:
      0 14px 26px -14px rgba(12, 8, 5, 0.72),
      0 3px 7px rgba(12, 8, 5, 0.32);
    transition:
      transform 0.12s ease,
      box-shadow 0.12s ease,
      background-color 0.12s ease;
  }

  .action:hover:not(:disabled) {
    background: #fffdf6;
    transform: translateY(-1px);
    box-shadow:
      0 18px 30px -14px rgba(12, 8, 5, 0.74),
      0 4px 9px rgba(12, 8, 5, 0.34);
  }

  .action:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow:
      0 4px 10px -6px rgba(12, 8, 5, 0.62),
      0 1px 2px rgba(12, 8, 5, 0.3);
  }

  .action:disabled {
    cursor: default;
    opacity: 0.72;
  }

  @media (max-width: 720px) {
    .rail-right {
      left: 10px;
      right: 10px;
      width: auto;
    }

    .keys {
      display: none;
    }

    .action {
      height: 60px;
      font-size: 1.25rem;
    }
  }
</style>
