<script lang="ts">
  import { game } from '../game/gameState.svelte';

  interface Props {
    onStart: () => void;
    onHowToPlay: () => void;
    onFullscreen?: () => void;
  }

  let { onStart, onHowToPlay, onFullscreen }: Props = $props();
</script>

<div class="relative mx-auto flex w-full max-w-3xl sm:max-w-4xl flex-col items-center justify-center rounded-3xl border-[4.5px] border-[#221811] bg-[#fdf8e6] p-6 text-center shadow-[10px_10px_0px_#181512] sm:p-12">
  <!-- Cardboard paper tape clips at top -->
  <div class="absolute -top-4 left-16 h-7 w-28 rounded-md border-2 border-[#181512] bg-[#fef08a] shadow-[2.5px_2.5px_0px_#181512]"></div>
  <div class="absolute -top-4 right-16 h-7 w-28 rounded-md border-2 border-[#181512] bg-[#fef08a] shadow-[2.5px_2.5px_0px_#181512]"></div>

  <!-- Best Score Sticker -->
  <div class="mb-4 inline-flex items-center gap-2 rounded-2xl border-2 border-[#181512] bg-[#fef3c7] px-5 py-2 font-mono shadow-[3px_3px_0px_#181512]">
    <span class="text-base">🏆</span>
    <span class="text-xs sm:text-sm font-black uppercase tracking-wider text-[#92400e]">HIGH SCORE:</span>
    <span class="text-lg sm:text-xl font-black text-[#181512]">{game.highScore.toLocaleString()}</span>
  </div>

  <!-- Giant Title -->
  <div class="relative my-3 select-none">
    <h1 class="font-mono text-6xl font-black tracking-tight text-[#181512] sm:text-8xl">
      LASER<span class="text-[#ef4444]">BLINK</span>
    </h1>
    <!-- Red laser strike underline with intense glow -->
    <div class="relative mx-auto mt-2 h-2.5 w-full max-w-lg rounded-full bg-gradient-to-r from-transparent via-[#ef4444] to-transparent shadow-[0_0_16px_#ef4444]"></div>
    <p class="mt-4 font-mono text-sm font-black uppercase tracking-widest text-[#78350f] sm:text-base">
      MEMORIZE · REFLECT · BURN
    </p>
  </div>

  <!-- Geometry Dash Style Giant Play Button -->
  <div class="my-8">
    <button
      onclick={onStart}
      class="group relative flex h-24 w-72 sm:h-28 sm:w-84 items-center justify-center gap-4 rounded-3xl border-[4.5px] border-[#181512] bg-[#facc15] font-mono text-2xl sm:text-3xl font-black uppercase text-[#181512] shadow-[8px_8px_0px_#181512] transition-all hover:-translate-y-1 hover:bg-[#fde047] hover:shadow-[10px_10px_0px_#181512] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
    >
      <!-- Geometry Dash triangle play icon -->
      <span class="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#181512] bg-white text-2xl shadow-[3px_3px_0px_#181512] transition-transform group-hover:scale-110">
        ▶
      </span>
      <span>PLAY</span>
    </button>
  </div>

  <!-- Secondary Actions -->
  <div class="flex flex-wrap items-center justify-center gap-3.5">
    <button
      onclick={onHowToPlay}
      class="flex h-12 items-center gap-2 rounded-xl border-2 border-[#181512] bg-white px-6 font-mono text-xs sm:text-sm font-black uppercase text-[#181512] shadow-[3px_3px_0px_#181512] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      <span>❓ HOW TO PLAY</span>
    </button>

    <button
      onclick={() => game.toggleSound()}
      class="flex h-12 items-center gap-2 rounded-xl border-2 border-[#181512] bg-white px-5 font-mono text-xs sm:text-sm font-black uppercase text-[#181512] shadow-[3px_3px_0px_#181512] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      <span>{game.settings.sound ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}</span>
    </button>

    {#if onFullscreen}
      <button
        onclick={onFullscreen}
        class="flex h-12 items-center gap-2 rounded-xl border-2 border-[#181512] bg-white px-5 font-mono text-xs sm:text-sm font-black uppercase text-[#181512] shadow-[3px_3px_0px_#181512] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <span>⛶ FULLSCREEN</span>
      </button>
    {/if}
  </div>

  <!-- Quick Rules Preview Strip -->
  <div class="mt-10 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3">
    <div class="rounded-2xl border-2 border-[#181512] bg-white/80 p-4 shadow-[3px_3px_0px_#181512]">
      <div class="font-mono text-xs sm:text-sm font-black text-[#dc2626]">1. FLASH & MEMORIZE</div>
      <div class="mt-1.5 font-mono text-xs font-bold text-[#4b5563]">
        Paper balls appear along a ricochet path. Memorize their spots before they vanish!
      </div>
    </div>
    <div class="rounded-2xl border-2 border-[#181512] bg-white/80 p-4 shadow-[3px_3px_0px_#181512]">
      <div class="font-mono text-xs sm:text-sm font-black text-[#ca8a04]">2. BLINK & AIM</div>
      <div class="mt-1.5 font-mono text-xs font-bold text-[#4b5563]">
        The balls disappear! Drag or use arrow keys to aim your laser reflecting off the walls.
      </div>
    </div>
    <div class="rounded-2xl border-2 border-[#181512] bg-white/80 p-4 shadow-[3px_3px_0px_#181512]">
      <div class="font-mono text-xs sm:text-sm font-black text-[#16a34a]">3. BURN & SCORE</div>
      <div class="mt-1.5 font-mono text-xs font-bold text-[#4b5563]">
        Press SPACE to fire! The laser burns the paper balls to charred ash for massive score!
      </div>
    </div>
  </div>
</div>
