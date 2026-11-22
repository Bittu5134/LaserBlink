<script lang="ts">
  import { onMount } from 'svelte';
  import { drawScene, type SceneState } from '../game/render/scene';
  import { fx } from '../game/render/particles';
  import { preloadSprites } from '../game/render/sprites';
  import { setPlayfield } from '../game/level';

  interface Props {
    scene: SceneState;
    onAim?: (angle: number) => void;
    onAdvance?: () => void;
    onResize?: () => void;
  }

  let { scene, onAim, onAdvance, onResize }: Props = $props();
  let canvas = $state<HTMLCanvasElement | null>(null);

  // One logical unit is a fixed slice of the short screen side, so the field
  // always fills the window instead of letterboxing inside it.
  const SHORT_SIDE = 625;

  let view = { scale: 1, dpr: 1 };

  const aimHint = $derived(
    scene.phase === 'aim'
      ? 'Targets hidden. Drag to aim. Right-click or Space fires.'
      : scene.phase === 'study'
        ? 'Study the targets. Right-click or Space starts aiming.'
        : 'Results are marked on the field.',
  );

  onMount(() => {
    preloadSprites();

    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      const scale = Math.min(width, height) / SHORT_SIDE;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      view = { scale, dpr };
      setPlayfield(width / scale, height / scale);
      onResize?.();
    };

    const loop = () => {
      if (!canvas) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(view.scale * view.dpr, 0, 0, view.scale * view.dpr, 0, 0);

      fx.update();
      drawScene(ctx, scene);
      animId = requestAnimationFrame(loop);
    };

    window.addEventListener('resize', resize);
    resize();
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  });

  function pointerToAngle(event: PointerEvent): number | null {
    if (!canvas || !scene.plan) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / view.scale;
    const y = (event.clientY - rect.top) / view.scale;
    const dx = x - scene.plan.player.x;
    const dy = y - scene.plan.player.y;
    if (Math.hypot(dx, dy) < 8) return null;
    return Math.atan2(dy, dx);
  }

  function handlePointerMove(event: PointerEvent) {
    if (scene.phase !== 'aim' || !onAim) return;
    if (event.pointerType === 'mouse' || event.buttons > 0) {
      const angle = pointerToAngle(event);
      if (angle !== null) onAim(angle);
    }
  }

  let pressOrigin: { x: number; y: number } | null = null;

  function handlePointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    canvas?.setPointerCapture(event.pointerId);
    pressOrigin = { x: event.clientX, y: event.clientY };
    if (scene.phase !== 'aim' || !onAim) return;
    const angle = pointerToAngle(event);
    if (angle !== null) onAim(angle);
  }

  // A click commits: skip the study window, fire, or turn the page. A drag
  // only aims, so releasing after a drag never fires by accident.
  function handlePointerUp(event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const origin = pressOrigin;
    pressOrigin = null;
    if (!origin) return;
    const moved = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
    if (moved > 6) return;
    onAdvance?.();
  }

  // Right-click only suppresses the browser menu; the field owns its input.
  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
  }
</script>

<canvas
  bind:this={canvas}
  class="arena-canvas"
  class:is-aiming={scene.phase === 'aim'}
  onpointermove={handlePointerMove}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  oncontextmenu={handleContextMenu}
  aria-label={aimHint}
></canvas>

<style>
  .arena-canvas {
    position: fixed;
    inset: 0;
    z-index: 0;
    display: block;
    touch-action: none;
  }

  .arena-canvas.is-aiming {
    cursor: crosshair;
  }
</style>
