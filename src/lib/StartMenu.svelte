<script lang="ts">
  import { game } from '../game/gameState.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    onStart: (seed?: string) => void;
    onHowToPlay: () => void;
    onFullscreen?: () => void;
  }

  let { onStart, onHowToPlay, onFullscreen }: Props = $props();

  let seed = $state('');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = seed.trim();
    onStart(trimmed ? trimmed : undefined);
  }
</script>

<article class="menu-screen">
  <h1>Laser<span>Blink</span></h1>

  <form class="menu-form" onsubmit={submit}>
    <button class="play-btn" type="submit">
      Play
      <Icon name="play" size={26} />
    </button>

    <div class="run-row">
      <label class="run-label" for="run-code">Run code</label>
      <input
        id="run-code"
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
    box-shadow: 7px 7px 0 rgba(0, 0, 0, 0.42);
    transform: rotate(-0.7deg);
    transition:
      transform 0.14s ease,
      box-shadow 0.14s ease,
      background-color 0.14s ease;
  }

  .play-btn:hover {
    background: #fffaf0;
    transform: rotate(-0.7deg) translate(-1px, -2px);
    box-shadow: 9px 9px 0 rgba(0, 0, 0, 0.44);
  }

  .play-btn:active {
    transform: rotate(-0.7deg) translate(3px, 3px);
    box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.42);
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
    border-bottom: 1px solid rgba(251, 244, 227, 0.45);
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
      gap: 24px;
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
