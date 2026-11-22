<script lang="ts">
  import { game, DIFFICULTY_LABELS, type Mode } from '../game/gameState.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    onStart: (seed?: string) => void;
    onHowToPlay: () => void;
    onFullscreen?: () => void;
  }

  let { onStart, onHowToPlay, onFullscreen }: Props = $props();

  let seed = $state('');
  let mode = $state<Mode>(game.mode);
  let difficulty = $state(game.difficulty);

  const difficultyLabel = $derived(DIFFICULTY_LABELS[difficulty - 1] ?? 'Normal');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = seed.trim();
    game.mode = mode;
    game.difficulty = difficulty;
    onStart(trimmed ? trimmed : undefined);
  }
</script>

<article class="menu-screen">
  <h1>Laser<span>Blink</span></h1>

  <form class="menu-form" onsubmit={submit}>
    <div class="mode-row" role="group" aria-label="Mode">
      <button
        class="mode-btn"
        class:is-on={mode === 'notebook'}
        type="button"
        aria-pressed={mode === 'notebook'}
        onclick={() => (mode = 'notebook')}
      >
        Classic
      </button>
      <button
        class="mode-btn"
        class:is-on={mode === 'endless'}
        type="button"
        aria-pressed={mode === 'endless'}
        onclick={() => (mode = 'endless')}
      >
        Endless
      </button>
    </div>

    <div class="difficulty">
      <label class="run-label" for="difficulty">Difficulty</label>
      <input
        id="difficulty"
        class="slider"
        type="range"
        min="1"
        max="5"
        step="1"
        bind:value={difficulty}
        aria-valuetext={difficultyLabel}
      />
      <output class="difficulty-value" for="difficulty">{difficultyLabel}</output>
    </div>

    <button class="play-btn" type="submit">
      Play
      <Icon name="play" size={26} />
    </button>

    <div class="run-row">
      <label class="run-label" for="game-code">Game code</label>
      <input
        id="game-code"
        class="run-input"
        bind:value={seed}
        maxlength="24"
        placeholder="optional"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
      />
    </div>
  </form>

  <nav class="menu-tools" aria-label="Menu">
    <button class="menu-icon" type="button" onclick={onHowToPlay} title="How to play" aria-label="How to play">
      <Icon name="help" size={21} />
    </button>
    <button
      class="menu-icon"
      type="button"
      onclick={() => game.toggleSound()}
      aria-pressed={game.settings.sound}
      title={game.settings.sound ? 'Turn sound off (M)' : 'Turn sound on (M)'}
      aria-label={game.settings.sound ? 'Turn sound off' : 'Turn sound on'}
    >
      <Icon name={game.settings.sound ? 'sound' : 'mute'} size={21} />
    </button>
    <button
      class="menu-icon"
      type="button"
      onclick={() => game.toggleReducedMotion()}
      aria-pressed={game.settings.reducedMotion}
      title={game.settings.reducedMotion ? 'Turn reduced motion off' : 'Turn reduced motion on'}
      aria-label={game.settings.reducedMotion ? 'Turn reduced motion off' : 'Turn reduced motion on'}
    >
      <Icon name="motion" size={21} />
    </button>
    {#if onFullscreen}
      <button class="menu-icon" type="button" onclick={onFullscreen} title="Fullscreen (F)" aria-label="Toggle fullscreen">
        <Icon name="fullscreen" size={21} />
      </button>
    {/if}
  </nav>
</article>

<style>
  .menu-screen {
    width: min(100%, 1100px);
    min-height: calc(100dvh - 24px);
    margin: auto;
    padding: 24px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(26px, 5vh, 48px);
    text-align: center;
  }

  h1 {
    font-family: var(--font-display);
    font-size: clamp(4rem, 13vw, 9.5rem);
    font-weight: 800;
    line-height: 0.82;
    letter-spacing: -0.055em;
    color: var(--color-paper);
    text-shadow:
      0 2px 0 rgba(83, 43, 23, 0.9),
      0 10px 28px rgba(0, 0, 0, 0.55);
    transform: rotate(-0.8deg);
  }

  h1 span {
    color: var(--color-laser);
  }

  .menu-form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(18px, 3vh, 28px);
  }

  .play-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-width: min(320px, 82vw);
    min-height: 76px;
    padding: 1rem 2.4rem;
    border: 2px solid var(--color-ink);
    border-radius: 2px;
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-display);
    font-size: clamp(1.35rem, 3vw, 1.7rem);
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    box-shadow:
      0 16px 28px -14px rgba(0, 0, 0, 0.62),
      0 3px 8px rgba(0, 0, 0, 0.28);
    transform: rotate(-0.7deg);
    transition:
      transform 0.14s ease,
      box-shadow 0.14s ease,
      background-color 0.14s ease;
  }

  .play-btn:hover {
    background: #fffaf0;
    transform: rotate(-0.7deg) translate(-1px, -2px);
    box-shadow:
      0 20px 32px -14px rgba(0, 0, 0, 0.64),
      0 4px 10px rgba(0, 0, 0, 0.3);
  }

  .play-btn:active {
    transform: rotate(-0.7deg) translate(3px, 3px);
    box-shadow:
      0 6px 12px -8px rgba(0, 0, 0, 0.55),
      0 1px 3px rgba(0, 0, 0, 0.25);
  }

  .mode-row {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1px dashed rgba(251, 244, 227, 0.5);
    border-radius: 2px;
    overflow: hidden;
  }

  .mode-btn {
    min-width: 128px;
    min-height: 48px;
    padding: 0 18px;
    border: 0;
    background: transparent;
    color: rgba(251, 244, 227, 0.74);
    font-family: var(--font-mono);
    font-size: 0.9375rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;
  }

  .mode-btn.is-on {
    background: var(--color-paper);
    color: var(--color-ink);
  }

  .mode-btn:not(.is-on):hover {
    background: rgba(251, 244, 227, 0.12);
    color: var(--color-paper);
  }

  .difficulty {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    max-width: 100%;
    padding: 8px 14px;
    border: 1px dashed rgba(251, 244, 227, 0.5);
    border-radius: 2px;
  }

  .slider {
    width: min(240px, 52vw);
    accent-color: var(--color-laser);
  }

  .difficulty-value {
    min-width: 5.5ch;
    font-family: var(--font-mono);
    font-size: 0.9375rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: left;
    color: var(--color-paper);
  }

  .run-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .run-label {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(251, 244, 227, 0.68);
    white-space: nowrap;
  }

  .run-input {
    width: min(180px, 46vw);
    min-height: 40px;
    padding: 2px 2px 5px;
    border: 0;
    border-bottom: 1px dashed rgba(251, 244, 227, 0.55);
    border-radius: 0;
    background: transparent;
    color: var(--color-paper);
    font-family: var(--font-mono);
    font-size: 0.95rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .run-input::placeholder {
    color: rgba(251, 244, 227, 0.4);
    letter-spacing: 0.02em;
    text-transform: none;
  }

  .run-input:focus {
    outline: none;
    border-bottom-color: var(--color-paper);
  }

  .menu-tools {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .menu-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 50%;
    background: transparent;
    color: rgba(251, 244, 227, 0.68);
    transition:
      color 0.15s ease,
      border-color 0.15s ease,
      background-color 0.15s ease;
  }

  .menu-icon:hover {
    border-color: rgba(251, 244, 227, 0.45);
    background: rgba(0, 0, 0, 0.16);
    color: var(--color-paper);
  }

  @media (max-width: 460px) {
    .menu-screen {
      gap: 22px;
      padding: 20px 16px;
    }

    .mode-row {
      width: 100%;
      max-width: 330px;
    }

    .mode-btn {
      flex: 1 1 0;
      min-width: 0;
      padding: 0 10px;
      font-size: 0.875rem;
    }

    .slider {
      width: min(190px, 46vw);
    }

    .play-btn {
      min-height: 68px;
    }

    .run-row {
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .run-input {
      width: min(260px, 72vw);
      text-align: center;
    }
  }
</style>
