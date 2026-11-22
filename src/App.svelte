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

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  onMount(() => {
    function handleKeyDown(e: KeyboardEvent) {
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
      } else if (e.code === 'KeyF') {
        toggleFullscreen();
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

<main class="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#20150d] p-2 sm:p-4 lg:p-6 text-[#181512]">
  <!-- Cardboard desk texture backdrop pattern -->
  <div class="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(#d97706_1.5px,transparent_1.5px)] [background-size:28px_28px]"></div>

  <!-- PC screen optimized container: scales up to 1540px wide and fits comfortably on desktop -->
  <div class="relative z-10 flex w-full max-w-[min(1540px,96vw)] flex-col items-center justify-center">
    {#if game.phase === 'menu'}
      <StartMenu
        onStart={() => game.startGame()}
        onHowToPlay={() => (showHowToPlay = true)}
        onFullscreen={toggleFullscreen}
      />
    {:else}
      <!-- Gameplay Screen with Geometry Dash proportions scaled for PC -->
      <div class="flex w-full flex-col">
        <HudBar
          onFire={() => game.fireLaser()}
          onNext={() => game.nextRound()}
          onMenu={() => game.goToMenu()}
          onFullscreen={toggleFullscreen}
        />

        <div class="mx-auto w-full max-w-[min(1500px,calc((100vh-170px)*1.6))]">
          <GameCanvas
            {scene}
            onAim={(angle) => game.setAimAngle(angle)}
          />
        </div>
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
