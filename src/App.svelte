<script lang="ts">
  import { onMount } from 'svelte';
  import GameCanvas from './lib/GameCanvas.svelte';
  import HudBar from './lib/HudBar.svelte';
  import StartMenu from './lib/StartMenu.svelte';
  import GameOverModal from './lib/GameOverModal.svelte';
  import HowToPlayModal from './lib/HowToPlayModal.svelte';
  import { game } from './game/gameState.svelte';
  import type { SceneState } from './game/render/scene';

  let showHowToPlay = $state(false);

  // Dynamic scene projection for the canvas
  const scene: SceneState = $derived({
    phase: game.phase,
    plan: game.plan,
    angle: game.angle,
    segments: game.segments,
    results: game.results ? game.results.results : null,
    beamProgress: game.beamProgress,
    studyCountdown: game.studyCountdown,
    assist: game.settings.assist,
    burntTargetIds: game.burntTargetIds,
  });

  onMount(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (showHowToPlay) {
          showHowToPlay = false;
        } else if (game.phase === 'menu') {
          game.startGame();
        } else if (game.phase === 'study') {
          game.enterAimPhase();
        } else if (game.phase === 'aim') {
          game.fireLaser();
        } else if (game.phase === 'reveal') {
          game.nextRound();
        } else if (game.phase === 'gameover') {
          game.retryGame();
        }
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        if (game.phase === 'aim') {
          e.preventDefault();
          game.adjustAngle(-0.025);
        }
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        if (game.phase === 'aim') {
          e.preventDefault();
          game.adjustAngle(0.025);
        }
      } else if (e.code === 'KeyM') {
        game.toggleSound();
      } else if (e.code === 'Escape') {
        if (showHowToPlay) {
          showHowToPlay = false;
        } else if (game.phase !== 'menu') {
          game.goToMenu();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<main class="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#241a12] p-3 sm:p-6 text-[#181512]">
  <!-- Cardboard desk texture backdrop pattern -->
  <div class="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px]"></div>

  <div class="relative z-10 w-full max-w-5xl">
    {#if game.phase === 'menu'}
      <StartMenu
        onStart={() => game.startGame()}
        onHowToPlay={() => (showHowToPlay = true)}
      />
    {:else}
      <!-- Gameplay Screen with Geometry Dash proportions -->
      <div class="mx-auto flex flex-col">
        <HudBar
          onFire={() => game.fireLaser()}
          onNext={() => game.nextRound()}
          onMenu={() => game.goToMenu()}
        />

        <GameCanvas
          {scene}
          onAim={(angle) => game.setAimAngle(angle)}
        />
      </div>
    {/if}
  </div>

  <!-- Game Over Modal -->
  {#if game.phase === 'gameover'}
    <GameOverModal
      onRetry={() => game.retryGame()}
      onMenu={() => game.goToMenu()}
    />
  {/if}

  <!-- How to Play Modal -->
  {#if showHowToPlay}
    <HowToPlayModal onClose={() => (showHowToPlay = false)} />
  {/if}
</main>
