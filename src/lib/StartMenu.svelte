<script lang="ts">
  import { game } from '../game/gameState.svelte';

  interface Props {
    onStart: () => void;
    onHowToPlay: () => void;
  }

  let { onStart, onHowToPlay }: Props = $props();
</script>

<div class="relative mx-auto flex w-full max-w-2xl flex-col items-center justify-center rounded-2xl border-[4px] border-[#221811] bg-[#fdf8e6] p-6 text-center shadow-[8px_8px_0px_#181512] sm:p-10">
  <!-- Cardboard paper tape clips at top -->
  <div class="absolute -top-3.5 left-12 h-6 w-24 rounded border-2 border-[#181512] bg-[#fef08a] shadow-[2px_2px_0px_#181512]"></div>
  <div class="absolute -top-3.5 right-12 h-6 w-24 rounded border-2 border-[#181512] bg-[#fef08a] shadow-[2px_2px_0px_#181512]"></div>

  <!-- Best Score Sticker -->
  <div class="mb-4 inline-flex items-center gap-2 rounded-xl border-2 border-[#181512] bg-[#fef3c7] px-4 py-1.5 font-mono shadow-[3px_3px_0px_#181512]">
    <span class="text-sm">🏆</span>
    <span class="text-xs font-black uppercase tracking-wider text-[#92400e]">HIGH SCORE:</span>
    <span class="text-base font-black text-[#181512]">{game.highScore.toLocaleString()}</span>
  </div>

  <!-- Giant Title -->
  <div class="relative my-2 select-none">
    <h1 class="font-mono text-5xl font-black tracking-tight text-[#181512] sm:text-7xl">
      LASER<span class="text-[#ef4444]">BLINK</span>
    </h1>
    <!-- Red laser strike underline -->
    <div class="relative mx-auto mt-1 h-2 w-full max-w-md rounded-full bg-gradient-to-r from-transparent via-[#ef4444] to-transparent shadow-[0_0_12px_#ef4444]"></div>
    <p class="mt-3 font-mono text-xs font-black uppercase tracking-widest text-[#78350f] sm:text-sm">
      MEMORIZE · REFLECT · BURN
    </p>
  </div>

  <!-- Geometry Dash Style Giant Play Button -->
  <div class="my-6">
    <button
      onclick={onStart}
      class="group relative flex h-24 w-60 items-center justify-center gap-3 rounded-2xl border-[4px] border-[#181512] bg-[#facc15] font-mono text-2xl font-black uppercase text-[#181512] shadow-[6px_6px_0px_#181512] transition-all hover:-translate-y-1 hover:bg-[#fde047] hover:shadow-[8px_8px_0px_#181512] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
    >
      <!-- Geometry Dash triangle play icon -->
      <span class="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#181512] bg-white text-xl shadow-[2px_2px_0px_#181512] transition-transform group-hover:scale-110">
        ▶
      </span>
      <span>PLAY</span>
    </button>
  </div>

  <!-- Secondary Actions -->
  <div class="flex flex-wrap items-center justify-center gap-3">
    <button
      onclick={onHowToPlay}
      class="flex h-11 items-center gap-2 rounded-xl border-2 border-[#181512] bg-white px-5 font-mono text-xs font-black uppercase text-[#181512] shadow-[3px_3px_0px_#181512] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      <span>❓ HOW TO PLAY</span>
    </button>

    <button
      onclick={() => game.toggleSound()}
      class="flex h-11 items-center gap-2 rounded-xl border-2 border-[#181512] bg-white px-4 font-mono text-xs font-black uppercase text-[#181512] shadow-[3px_3px_0px_#181512] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      <span>{game.settings.sound ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}</span>
    </button>
  </div>

  <!-- Quick Rules Preview Strip -->
  <div class="mt-8 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-3">
    <div class="rounded-xl border-2 border-[#181512] bg-white/70 p-3 shadow-[2px_2px_0px_#181512]">
      <div class="font-mono text-xs font-black text-[#dc2626]">1. FLASH</div>
      <div class="mt-1 font-mono text-[11px] font-bold text-[#4b5563]">
        Paper balls appear at random. Memorize their positions!
      </div>
    </div>
    <div class="rounded-xl border-2 border-[#181512] bg-white/70 p-3 shadow-[2px_2px_0px_#181512]">
      <div class="font-mono text-xs font-black text-[#ca8a04]">2. BLINK & AIM</div>
      <div class="mt-1 font-mono text-[11px] font-bold text-[#4b5563]">
        Balls disappear! Aim your laser to reflect off the paper edges.
      </div>
    </div>
    <div class="rounded-xl border-2 border-[#181512] bg-white/70 p-3 shadow-[2px_2px_0px_#181512]">
      <div class="font-mono text-xs font-black text-[#16a34a]">3. BURN & SCORE</div>
      <div class="mt-1 font-mono text-[11px] font-bold text-[#4b5563]">
        Fire! Balls reveal and the laser burns them to ash for massive score!
      </div>
    </div>
  </div>
</div>
