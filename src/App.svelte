<script lang="ts">
  import GameCanvas from './lib/GameCanvas.svelte';
  import { generateRound } from './game/level';
  import type { SceneState } from './game/render/scene';

  const plan = generateRound(3);
  const scene: SceneState = $state({
    phase: 'study',
    plan,
    angle: -Math.PI / 2,
    segments: [],
    results: null,
    beamProgress: 0,
    assist: 'stub',
  });
</script>

<main class="min-h-dvh p-6">
  <div class="mx-auto max-w-3xl">
    <div class="neo-card overflow-hidden">
      <div class="border-b-[3px] border-ink bg-lemon px-5 py-3">
        <p class="neo-label">Round 03 / Study</p>
      </div>
      <div class="bg-screen p-2">
        <GameCanvas {scene} />
      </div>
      <div class="flex items-center justify-between gap-3 border-t-[3px] border-ink px-5 py-4">
        <span class="font-mono text-xs font-bold">TARGETS 3 · BOUNCES 3</span>
        <button class="neo-btn neo-btn-start px-5 py-3">LOCKED IN</button>
      </div>
    </div>
  </div>
</main>
