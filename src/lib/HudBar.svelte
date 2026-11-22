<script lang="ts">
  import { game, RUN_LENGTH } from '../game/gameState.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    onMenu: () => void;
    onHelp: () => void;
    onFullscreen?: () => void;
  }

  let { onMenu, onHelp, onFullscreen }: Props = $props();

  const targetCount = $derived(game.plan?.targets.length ?? 0);
  const requiredHits = $derived(game.plan?.requiredHits ?? 0);
  const canTrace = $derived(game.phase === 'aim' && game.ink > 0 && !game.previewActive);

  const announcement = $derived(
    game.phase === 'study'
      ? `Study. ${targetCount} targets.`
      : game.phase === 'aim'
        ? `Aim. Burn ${requiredHits} of ${targetCount} to pass.`
        : game.phase === 'firing'
          ? 'Firing.'
          : `${game.results?.hits ?? 0} of ${game.results?.total ?? targetCount} burned. ${
              game.roundPassed ? 'Passed.' : 'Failed.'
            }`,
  );
</script>

<aside class="rail rail-left" aria-label="Level">
  <div class="chip wide" aria-label={`Level ${game.round}${game.mode === 'notebook' ? ` of ${RUN_LENGTH}` : ''}`}>
    <span class="num">{String(game.round).padStart(2, '0')}</span>
    <span class="unit">{game.mode === 'notebook' ? `/${RUN_LENGTH}` : '∞'}</span>
  </div>

  <div class="chip wide" aria-label={`Score ${game.score}`}>
    <span class="value">{game.score.toLocaleString()}</span>
  </div>

  <nav class="tools" aria-label="Game controls">
    <button class="tool" type="button" onclick={onMenu} title="Home" aria-label="Back to the home screen">
      <Icon name="home" size={19} />
    </button>
    <button class="tool" type="button" onclick={onHelp} title="How to play (?)" aria-label="How to play">
      <Icon name="help" size={19} />
    </button>
    <button
      class="tool"
      type="button"
      onclick={() => game.toggleSound()}
      aria-pressed={game.settings.sound}
      title={game.settings.sound ? 'Sound off (M)' : 'Sound on (M)'}
      aria-label={game.settings.sound ? 'Turn sound off' : 'Turn sound on'}
    >
      <Icon name={game.settings.sound ? 'sound' : 'mute'} size={19} />
    </button>
    <button
      class="tool"
      type="button"
      onclick={() => game.toggleReducedMotion()}
      aria-pressed={game.settings.reducedMotion}
      title={game.settings.reducedMotion ? 'Motion off (V)' : 'Reduced motion (V)'}
      aria-label={game.settings.reducedMotion ? 'Turn reduced motion off' : 'Turn reduced motion on'}
    >
      <Icon name="motion" size={19} />
    </button>
    {#if onFullscreen}
      <button class="tool" type="button" onclick={onFullscreen} title="Fullscreen (F)" aria-label="Toggle fullscreen">
        <Icon name="fullscreen" size={19} />
      </button>
    {/if}
  </nav>

  <p class="sr-only" aria-live="polite">{announcement}</p>
</aside>

<aside class="rail rail-left-bottom" aria-label="Mistakes and assist">
  {#if game.mode === 'notebook'}
    <div class="chip wide lives" aria-label={`${game.lives} of ${game.maxLives} mistakes left`}>
      {#each Array(game.maxLives) as _, index}
        <span class="ball" class:is-lost={index >= game.lives}></span>
      {/each}
    </div>
  {/if}

  <div class="chip wide assist">
    <span class="pips" aria-label={`${game.ink} of ${game.maxInk} assists left`}>
      {#each Array(game.maxInk) as _, index}
        <span class="pip" class:is-empty={index >= game.ink}></span>
      {/each}
    </span>
    <button
      class="assist-btn"
      type="button"
      onclick={() => game.useInk()}
      disabled={!canTrace}
      title={canTrace ? 'Trace the full line, one assist (I)' : 'No assists left'}
    >
      Assist
    </button>
  </div>
</aside>

<style>
  .rail {
    position: fixed;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    pointer-events: none;
  }

  .rail-left {
    top: clamp(10px, 2vh, 20px);
    left: clamp(10px, 1.8vw, 22px);
    width: 156px;
  }

  .rail-left-bottom {
    bottom: clamp(10px, 2vh, 20px);
    left: clamp(10px, 1.8vw, 22px);
    width: 156px;
  }

  /* Every HUD mark shares one height so the column reads as a stack. */
  .chip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 44px;
    padding: 0 12px;
    border: 1px solid rgba(247, 235, 208, 0.2);
    border-radius: 2px;
    background: rgba(28, 19, 11, 0.74);
    color: #fbf3e1;
  }

  .wide {
    width: 100%;
  }

  .num {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .unit {
    font-family: var(--font-mono);
    font-size: 0.9375rem;
    font-weight: 800;
    opacity: 0.76;
  }

  .value {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    padding: 2px;
    border: 1px solid rgba(247, 235, 208, 0.2);
    border-radius: 2px;
    background: rgba(28, 19, 11, 0.74);
    pointer-events: auto;
  }

  .tool {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 2px;
    background: transparent;
    color: rgba(251, 243, 225, 0.78);
    transition:
      color 0.15s ease,
      border-color 0.15s ease,
      background-color 0.15s ease;
  }

  .tool:hover {
    border-color: rgba(247, 235, 208, 0.42);
    background: rgba(0, 0, 0, 0.22);
    color: #fbf3e1;
  }

  .lives {
    gap: 7px;
  }

  .ball {
    width: 14px;
    height: 14px;
    border-radius: 48% 52% 46% 54% / 52% 46% 54% 48%;
    background: radial-gradient(circle at 34% 28%, #fffaf0, #ddcbaa 58%, #a08a64 100%);
  }

  .ball.is-lost {
    background: transparent;
    border: 1.5px solid rgba(247, 235, 208, 0.34);
  }

  .assist {
    gap: 10px;
    padding: 0 8px 0 12px;
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
  }

  .pip.is-empty {
    background: transparent;
    border: 1.5px solid rgba(247, 235, 208, 0.4);
  }

  .assist-btn {
    flex: 1;
    height: 30px;
    border: 1px solid rgba(247, 235, 208, 0.34);
    border-radius: 2px;
    background: transparent;
    color: #fbf3e1;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    pointer-events: auto;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease,
      opacity 0.15s ease;
  }

  .assist-btn:hover:not(:disabled) {
    border-color: #fbf3e1;
    background: rgba(251, 243, 225, 0.12);
  }

  .assist-btn:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  @media (max-width: 720px) {
    .rail-left,
    .rail-left-bottom {
      width: 124px;
    }

    .num {
      font-size: 1.25rem;
    }

    .value {
      font-size: 1.05rem;
    }

    .tool {
      width: 34px;
      height: 34px;
    }
  }
</style>
