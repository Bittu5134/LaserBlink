<script lang="ts">
  import { onMount } from 'svelte';
  import { drawScene, type SceneState } from '../game/render/scene';

  interface Props {
    scene: SceneState;
    onAim?: (angle: number) => void;
  }

  let { scene, onAim }: Props = $props();
  let canvas = $state<HTMLCanvasElement | null>(null);

  const LOGICAL_W = 1000;
  const LOGICAL_H = 625;

  onMount(() => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(width * 0.625 * dpr);
      ctx.setTransform((width * dpr) / LOGICAL_W, 0, 0, (width * dpr) / LOGICAL_W, 0, 0);
    };

    const loop = () => {
      drawScene(ctx, scene);
      frame = requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });

  function aimAt(event: PointerEvent): void {
    if (!canvas || !scene.plan || !onAim) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * LOGICAL_W;
    const y = ((event.clientY - rect.top) / rect.height) * LOGICAL_H;
    const dx = x - scene.plan.player.x;
    const dy = y - scene.plan.player.y;
    if (Math.hypot(dx, dy) < 6) return;
    onAim(Math.atan2(dy, dx));
  }

  function handleMove(event: PointerEvent): void {
    if (scene.phase !== 'aim') return;
    if (event.pointerType === 'mouse' || event.buttons > 0) aimAt(event);
  }

  function handleDown(event: PointerEvent): void {
    if (scene.phase !== 'aim') return;
    event.preventDefault();
    aimAt(event);
    canvas?.setPointerCapture(event.pointerId);
  }
</script>

<canvas
  bind:this={canvas}
  class="block w-full touch-none"
  class:cursor-crosshair={scene.phase === 'aim'}
  style="aspect-ratio: 1000 / 625"
  onpointermove={handleMove}
  onpointerdown={handleDown}
  aria-label="Laser arena"
></canvas>
