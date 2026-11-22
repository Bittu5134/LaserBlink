<script lang="ts">
  import { game } from '../game/gameState.svelte';

  interface Props {
    onFire: () => void;
    onNext: () => void;
    onMenu: () => void;
    onFullscreen?: () => void;
  }

  let { onFire, onNext, onMenu, onFullscreen }: Props = $props();

  const studyProgress = $derived(() => {
    if (!game.plan || game.plan.studySeconds <= 0) return 0;
    return Math.max(0, Math.min(100, (game.studyCountdown / game.plan.studySeconds) * 100));
  });
</script>

<!-- TOP HUD BAR: Geometry Dash Arcade style with Scratchpad Flair -->
<div class="mb-3 flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border-[3.5px] border-[#221811] bg-[#fffcf2] px-4 py-2.5 shadow-[5px_5px_0px_#181512] sm:px-6">
  <!-- Left: Round Badge, Lives & Fullscreen -->
  <div class="flex items-center gap-2.5 sm:gap-3.5">
    <button
      onclick={onMenu}
      class="flex h-10 items-center justify-center rounded-xl border-2 border-[#181512] bg-[#fef08a] px-3.5 font-mono text-xs font-black uppercase text-[#181512] shadow-[2.5px_2.5px_0px_#181512] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-[#fde047]"
      title="Exit to menu"
    >
      ◀ MENU
    </button>

    <div class="flex items-center gap-2 rounded-xl border-2 border-[#181512] bg-[#fef9c3] px-3.5 py-1 font-mono text-sm font-black text-[#181512] shadow-[2.5px_2.5px_0px_#181512]">
      <span class="text-xs uppercase text-[#713f12]">STAGE</span>
      <span class="text-lg text-[#ca8a04]">{String(game.round).padStart(2, '0')}</span>
    </div>

    <!-- Paper ball lives -->
    <div class="flex items-center gap-1.5" title="Paper Shields (Lives)">
      {#each Array(game.maxLives) as _, i}
        <span
          class="text-xl transition-all duration-200"
          class:opacity-20={i >= game.lives}
          class:scale-110={i < game.lives}
        >
          📄
        </span>
      {/each}
    </div>
  </div>

  <!-- Center: Phase Status & Countdown Bar -->
  <div class="flex min-w-[240px] flex-1 flex-col items-center justify-center px-2">
    {#if game.phase === 'study'}
      <div class="flex items-center gap-2 font-mono text-xs font-black tracking-wider text-[#b45309] sm:text-sm">
        <span class="animate-pulse">👀</span>
        <span>MEMORIZE BALLS:</span>
        <span class="rounded bg-[#fef08a] px-2 py-0.5 text-base font-black text-[#181512]">{game.studyCountdown.toFixed(1)}s</span>
      </div>
      <!-- Geometry Dash style countdown bar -->
      <div class="mt-1 h-3.5 w-full max-w-sm overflow-hidden rounded-full border-2 border-[#181512] bg-[#e5e7eb]">
        <div
          class="h-full bg-gradient-to-r from-[#eab308] to-[#ef4444] transition-all duration-100"
          style="width: {studyProgress()}%;"
        ></div>
      </div>
    {:else if game.phase === 'aim'}
      <div class="flex items-center gap-2 font-mono text-xs font-black tracking-wider text-[#dc2626] sm:text-sm">
        <span class="inline-block animate-bounce">⚡</span>
        <span>AIM & BOUNCE OFF EDGES!</span>
      </div>
      <div class="mt-0.5 font-mono text-[11px] font-bold text-[#6b7280]">
        TARGETS HIDDEN · {game.plan?.maxBounces ?? 3} BOUNCES ALLOWED
      </div>
    {:else if game.phase === 'firing'}
      <div class="flex items-center gap-2 font-mono text-xs font-black tracking-wider text-[#ea580c] sm:text-sm">
        <span class="animate-spin">🔥</span>
        <span>BURNING TARGETS...</span>
      </div>
    {:else if game.phase === 'reveal'}
      <div class="flex items-center gap-2 font-mono text-xs font-black tracking-wider text-[#16a34a] sm:text-sm">
        <span>✨</span>
        <span>{game.results?.hits ?? 0}/{game.results?.total ?? 0} BURNT!</span>
        {#if game.roundPerfect}
          <span class="rounded bg-[#fde047] px-2 py-0.5 text-[#181512]">PERFECT ASH!</span>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Right: Score, High Score & Fullscreen -->
  <div class="flex items-center gap-2.5">
    <div class="rounded-xl border-2 border-[#181512] bg-[#f8fafc] px-3.5 py-1 text-right font-mono shadow-[2.5px_2.5px_0px_#181512]">
      <div class="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">SCORE</div>
      <div class="text-lg font-black text-[#0f172a]">{game.score.toLocaleString()}</div>
    </div>

    <div class="hidden sm:block rounded-xl border-2 border-[#181512] bg-[#fef3c7] px-3.5 py-1 text-right font-mono shadow-[2.5px_2.5px_0px_#181512]">
      <div class="text-[10px] font-bold uppercase tracking-wider text-[#b45309]">BEST</div>
      <div class="text-lg font-black text-[#92400e]">{game.highScore.toLocaleString()}</div>
    </div>

    {#if onFullscreen}
      <button
        onclick={onFullscreen}
        class="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#181512] bg-white text-sm shadow-[2.5px_2.5px_0px_#181512] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-[#f1f5f9]"
        title="Toggle Fullscreen (F)"
        aria-label="Toggle Fullscreen"
      >
        ⛶
      </button>
    {/if}
  </div>
</div>

<!-- BOTTOM ACTION BAR: Geometry Dash chunky buttons -->
<div class="mt-3 flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border-[3.5px] border-[#221811] bg-[#fffcf2] px-4 py-2.5 shadow-[5px_5px_0px_#181512] sm:px-6">
  <!-- Left: Audio & Assist Controls -->
  <div class="flex items-center gap-2.5">
    <button
      onclick={() => game.toggleSound()}
      class="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#181512] bg-[#f1f5f9] text-lg shadow-[2.5px_2.5px_0px_#181512] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-white"
      title={game.settings.sound ? 'Mute sound (M)' : 'Unmute sound (M)'}
      aria-label="Toggle Sound"
    >
      {game.settings.sound ? '🔊' : '🔇'}
    </button>

    <button
      onclick={() => game.toggleAssist()}
      class="flex h-11 items-center gap-1.5 rounded-xl border-2 border-[#181512] bg-[#f1f5f9] px-3.5 font-mono text-xs font-bold text-[#181512] shadow-[2.5px_2.5px_0px_#181512] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-white"
      title="Toggle assist mode (Aim dots / Full circle guide)"
    >
      <span>GUIDE:</span>
      <span class="font-black uppercase text-[#2563eb]">{game.settings.assist}</span>
    </button>

    <div class="hidden lg:flex items-center gap-1.5 font-mono text-xs font-semibold text-[#64748b] ml-3">
      <span class="rounded border border-[#cbd5e1] bg-[#f8fafc] px-1.5 py-0.5">DRAG</span> to aim ·
      <span class="rounded border border-[#cbd5e1] bg-[#f8fafc] px-1.5 py-0.5">SPACE</span> to fire ·
      <span class="rounded border border-[#cbd5e1] bg-[#f8fafc] px-1.5 py-0.5">F</span> fullscreen
    </div>
  </div>

  <!-- Right: Big Chunky Geometry Dash Action Button -->
  <div class="flex items-center gap-3">
    {#if game.phase === 'study'}
      <button
        onclick={() => game.enterAimPhase()}
        class="flex h-13 items-center gap-2.5 rounded-2xl border-[3.5px] border-[#181512] bg-[#fef08a] px-7 font-mono text-base font-black uppercase text-[#181512] shadow-[4px_4px_0px_#181512] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#181512] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none hover:bg-[#fde047]"
      >
        <span>READY NOW</span>
        <span class="text-lg">⚡</span>
      </button>
    {:else if game.phase === 'aim'}
      <button
        onclick={onFire}
        class="flex h-13 animate-pulse items-center gap-3 rounded-2xl border-[3.5px] border-[#181512] bg-[#ef4444] px-8 font-mono text-lg font-black uppercase text-white shadow-[5px_5px_0px_#181512] transition-all hover:brightness-110 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
      >
        <span>🔥 FIRE LASER</span>
        <span class="rounded-lg bg-white/25 px-2 py-0.5 text-xs text-white">SPACE</span>
      </button>
    {:else if game.phase === 'firing'}
      <button
        disabled
        class="flex h-13 cursor-not-allowed items-center gap-2.5 rounded-2xl border-[3.5px] border-[#181512] bg-[#f97316] px-7 font-mono text-base font-black uppercase text-white opacity-90 shadow-[2.5px_2.5px_0px_#181512]"
      >
        <span>⚡ FIRING...</span>
      </button>
    {:else if game.phase === 'reveal'}
      <button
        onclick={onNext}
        class="flex h-13 items-center gap-2.5 rounded-2xl border-[3.5px] border-[#181512] bg-[#22c55e] px-8 font-mono text-lg font-black uppercase text-white shadow-[5px_5px_0px_#181512] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#181512] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none hover:bg-[#16a34a]"
      >
        <span>NEXT ROUND</span>
        <span class="text-xl">➔</span>
      </button>
    {/if}
  </div>
</div>
