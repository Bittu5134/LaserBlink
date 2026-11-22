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

  const announcement = $derived(
    game.phase === 'study'
      ? `Study phase. ${targetCount} targets.`
      : game.phase === 'aim'
        ? `Aim phase. Burn ${requiredHits} of ${targetCount} to pass.`
        : game.phase === 'firing'
          ? 'Laser firing.'
          : `Reveal. ${game.results?.hits ?? 0} of ${game.results?.total ?? targetCount} burned. ${
              game.roundPassed ? 'Passed.' : 'Failed, one mistake used.'
            }`,
  );
</script>

<aside class="rail rail-left">
  <div class="chip page-chip" aria-label={`Level ${game.round}${game.mode === 'notebook' ? ` of ${RUN_LENGTH}` : ''}`}>
    <span class="page-now">{String(game.round).padStart(2, '0')}</span>
    <span class="page-total">{game.mode === 'notebook' ? `/${RUN_LENGTH}` : 'endless'}</span>
  </div>

  <div class="chip lives-chip" aria-label={`${game.lives} of ${game.maxLives} mistakes left`}>
    {#each Array(game.maxLives) as _, index}
      <span class="ball" class:is-lost={index >= game.lives}></span>
    {/each}
  </div>

  <div class="chip score-chip">
    <span class="chip-label">Score</span>
    <strong>{game.score.toLocaleString()}</strong>
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

<style>
  .rail-left {
    position: fixed;
    z-index: 10;
    top: clamp(10px, 2vh, 20px);
    left: clamp(10px, 1.8vw, 22px);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    pointer-events: none;
  }

  .chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    border: 1px solid rgba(247, 235, 208, 0.2);
    border-radius: 2px;
    background: rgba(28, 19, 11, 0.74);
    color: #fbf3e1;
    box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.8);
  }

  .page-chip {
    align-items: baseline;
    gap: 3px;
  }

  .page-now {
    font-family: var(--font-mono);
    font-size: 1.75rem;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .page-total {
    font-family: var(--font-mono);
    font-size: 0.95rem;
    font-weight: 800;
    opacity: 0.74;
  }

  .lives-chip {
    gap: 7px;
    padding: 10px 12px;
  }

  .ball {
    width: 14px;
    height: 14px;
    border-radius: 48% 52% 46% 54% / 52% 46% 54% 48%;
    background: radial-gradient(circle at 34% 28%, #fffaf0, #ddcbaa 58%, #a08a64 100%);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  }

  .ball.is-lost {
    background: transparent;
    border: 1.5px solid rgba(247, 235, 208, 0.34);
    box-shadow: none;
  }

  .score-chip {
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    padding: 6px 12px 7px;
  }

  .chip-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.72;
  }

  .score-chip strong {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }

  .tools {
    position: fixed;
    top: clamp(10px, 2vh, 20px);
    right: clamp(10px, 1.8vw, 22px);
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border: 1px solid rgba(247, 235, 208, 0.2);
    border-radius: 2px;
    background: rgba(28, 19, 11, 0.74);
    pointer-events: auto;
  }

  .tool {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
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

  @media (max-width: 720px) {
    .rail-left {
      gap: 6px;
    }

    .page-now {
      font-size: 1.5rem;
    }

    .score-chip strong {
      font-size: 1.25rem;
    }

    .tool {
      width: 40px;
      height: 40px;
    }
  }
</style>
