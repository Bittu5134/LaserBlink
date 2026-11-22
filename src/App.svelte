<script lang="ts">
  import { onMount } from 'svelte';
  import GameCanvas from './lib/GameCanvas.svelte';
  import HudBar from './lib/HudBar.svelte';
  import StartMenu from './lib/StartMenu.svelte';
  import GameControls from './lib/GameControls.svelte';
  import ResultsSlip from './lib/ResultsSlip.svelte';
  import GameOverModal from './lib/GameOverModal.svelte';
  import HowToPlayModal from './lib/HowToPlayModal.svelte';
  import ExitModal from './lib/ExitModal.svelte';
  import { game } from './game/gameState.svelte';
  import { traceBeam } from './game/beam';
  import { ARENA, absorberRects } from './game/level';
  import type { Segment } from './game/types';

  let showHelp = $state(false);
  let showExit = $state(false);

  const scene = $derived.by(() => {
    const plan = game.plan;
    let solutionSegments: Segment[] = [];
    // A page only counts as clean when every target burns; anything less shows
    // the route it wanted, passed or not.
    const missed = Boolean(plan && game.results && game.results.hits < game.results.total);

    if (missed && plan && Number.isFinite(plan.solutionAngle)) {
      const absorbers = absorberRects(plan);
      solutionSegments = traceBeam(
        plan.player,
        plan.solutionAngle,
        ARENA,
        plan.obstacles,
        plan.maxBounces,
        plan.mirrors,
        absorbers,
      ).segments;
    }

    return {
      phase: game.phase,
      plan,
      angle: game.angle,
      segments: game.segments,
      results: game.results ? game.results.results : null,
      beamProgress: game.beamProgress,
      studyCountdown: game.studyCountdown,
      studyEndsAt: game.studyEndsAt,
      previewActive: game.previewActive,
      previewSegments: game.previewSegments,
      solutionSegments,
      reducedMotion: game.settings.reducedMotion,
      failedReveal: missed,
      burntTargetIds: game.burntTargetIds,
    };
  });

  function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  function isButtonTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'BUTTON' || tag === 'A' || target.closest('button, a') !== null;
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // fullscreen is unavailable in this browser or blocked by the page context
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (showHelp) {
        showHelp = false;
      } else if (showExit) {
        showExit = false;
      } else if (game.phase !== 'menu' && game.phase !== 'gameover' && game.phase !== 'victory') {
        showExit = true;
      }
      return;
    }

    if (showHelp || showExit) return;

    if (isTypingTarget(event.target)) return;

    if (event.key === '?') {
      event.preventDefault();
      showHelp = true;
      return;
    }

    // Let a focused button handle its own activation, so Space never fires twice.
    if (isButtonTarget(event.target) && (event.code === 'Space' || event.key === 'Enter')) {
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      if (game.phase === 'menu') return;
      game.advance();
      return;
    }

    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      if (game.phase === 'aim') {
        event.preventDefault();
        game.adjustAngle(event.shiftKey ? -0.004 : -0.02);
      }
      return;
    }

    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      if (game.phase === 'aim') {
        event.preventDefault();
        game.adjustAngle(event.shiftKey ? 0.004 : 0.02);
      }
      return;
    }

    if (event.code === 'KeyI') {
      if (game.phase === 'aim') {
        event.preventDefault();
        game.useInk();
      }
      return;
    }

    if (event.code === 'KeyV') {
      game.toggleReducedMotion();
      return;
    }

    if (event.code === 'KeyM') {
      game.toggleSound();
      return;
    }

    if (event.code === 'KeyF') {
      toggleFullscreen();
    }
  }

  $effect(() => {
    document.documentElement.dataset.motion = game.settings.reducedMotion ? 'reduced' : 'full';
  });

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<main class="app" class:is-playing={game.phase !== 'menu'}>
  {#if game.phase === 'menu'}
    <StartMenu
      onStart={(seed) => game.startGame({ seed })}
      onHowToPlay={() => (showHelp = true)}
      onFullscreen={toggleFullscreen}
    />
  {:else}
    <GameCanvas
      {scene}
      onAim={(angle) => game.setAimAngle(angle)}
      onAdvance={() => game.advance()}
      onResize={() => game.syncPlayfield()}
    />

    <HudBar
      onMenu={() => game.goToMenu()}
      onHelp={() => (showHelp = true)}
      onFullscreen={toggleFullscreen}
    />

    <ResultsSlip />

    <GameControls onAdvance={() => game.advance()} />
  {/if}

  {#if game.phase === 'gameover' || game.phase === 'victory'}
    <GameOverModal
      onRetry={() => game.retryGame()}
      onNewRun={() => game.newRun()}
      onMenu={() => game.goToMenu()}
    />
  {/if}

  {#if showHelp}
    <HowToPlayModal onClose={() => (showHelp = false)} />
  {/if}

  {#if showExit}
    <ExitModal
      onResume={() => (showExit = false)}
      onReplay={() => {
        showExit = false;
        game.retryGame();
      }}
      onEndRun={() => {
        showExit = false;
        game.endRunNow();
      }}
      onHome={() => {
        showExit = false;
        game.goToMenu();
      }}
    />
  {/if}
</main>

<style>
  .app {
    position: relative;
    min-height: 100dvh;
  }

  .app:not(.is-playing) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
