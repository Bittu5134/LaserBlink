<script lang="ts">
  import { onMount } from 'svelte';
  import { drawScene, type SceneState } from '../game/render/scene';
  import { fx } from '../game/render/particles';
  import { preloadSprites } from '../game/render/sprites';

  interface Props {
    scene: SceneState;
    onAim?: (angle: number) => void;
  }

  let { scene, onAim }: Props = $props();
  let canvas = $state<HTMLCanvasElement | null>(null);

  const LOGICAL_W = 1000;
  const LOGICAL_H = 625;

  onMount(() => {
    preloadSprites();

    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(width * 0.625 * dpr);
      ctx.setTransform((width * dpr) / LOGICAL_W, 0, 0, (width * dpr) / LOGICAL_W, 0, 0);
    };

    const loop = () => {
      // Update particles on every frame
      fx.update();

      // Render entire scene
      drawScene(ctx, scene);

      animId = requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  });

  function pointerToAngle(event: PointerEvent): number | null {
    if (!canvas || !scene.plan) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * LOGICAL_W;
    const y = ((event.clientY - rect.top) / rect.height) * LOGICAL_H;
    const dx = x - scene.plan.player.x;
    const dy = y - scene.plan.player.y;
    if (Math.hypot(dx, dy) < 8) return null;
    return Math.atan2(dy, dx);
  }

  function handlePointerMove(event: PointerEvent) {
    if (scene.phase !== 'aim' || !onAim) return;
    // Aim when mouse moves or pointer is held down
    if (event.pointerType === 'mouse' || event.buttons > 0) {
      const angle = pointerToAngle(event);
      if (angle !== null) onAim(angle);
    }
  }

  function handlePointerDown(event: PointerEvent) {
    if (scene.phase !== 'aim' || !onAim) return;
    event.preventDefault();
    canvas?.setPointerCapture(event.pointerId);
    const angle = pointerToAngle(event);
    if (angle !== null) onAim(angle);
  }
</script>

<div class="relative w-full select-none overflow-hidden rounded-xl border-[3.5px] border-[#221811] bg-[#1a140f] shadow-[6px_6px_0px_#181512]">
  <canvas
    bind:this={canvas}
    class="block w-full touch-none"
    class:cursor-crosshair={scene.phase === 'aim'}
    style="aspect-ratio: 1000 / 625"
    onpointermove={handlePointerMove}
    onpointerdown={handlePointerDown}
    aria-label="LaserBlink scratchpad arena"
  ></canvas>
</div>
