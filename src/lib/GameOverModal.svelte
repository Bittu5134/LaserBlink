<script lang="ts">
  import { game } from '../game/gameState.svelte';

  interface Props {
    onRetry: () => void;
    onMenu: () => void;
  }

  let { onRetry, onMenu }: Props = $props();

  const isNewHigh = $derived(game.score > 0 && game.score >= game.highScore);
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
  <div class="relative w-full max-w-md rounded-2xl border-[4px] border-[#181512] bg-[#fdf8e6] p-6 text-center shadow-[8px_8px_0px_#181512] sm:p-8">
    <!-- Charred Burn Stamp Header -->
    <div class="mx-auto -mt-2 mb-4 inline-block -rotate-2 rounded-xl border-[3.5px] border-[#dc2626] bg-[#fee2e2] px-6 py-2 shadow-[4px_4px_0px_#dc2626]">
      <h2 class="font-mono text-3xl font-black uppercase tracking-wider text-[#991b1b] sm:text-4xl">
        GAME OVER
      </h2>
    </div>

    {#if isNewHigh}
      <div class="mb-4 inline-flex items-center gap-1.5 rounded-full border-2 border-[#181512] bg-[#fef08a] px-4 py-1 font-mono text-xs font-black text-[#854d0e] shadow-[2px_2px_0px_#181512]">
        <span>🎉</span> NEW HIGH SCORE!
      </div>
    {/if}

    <!-- Score Card -->
    <div class="my-4 rounded-xl border-2 border-[#181512] bg-white p-4 shadow-[3px_3px_0px_#181512]">
      <div class="font-mono text-xs font-black uppercase text-[#64748b]">FINAL SCORE</div>
      <div class="font-mono text-4xl font-black text-[#0f172a] sm:text-5xl">
        {game.score.toLocaleString()}
      </div>

      <div class="mt-4 grid grid-cols-3 divide-x-2 divide-[#e2e8f0] border-t-2 border-[#e2e8f0] pt-3 font-mono">
        <div>
          <div class="text-[10px] font-bold text-[#64748b]">STAGE</div>
          <div class="text-base font-black text-[#181512]">{game.round}</div>
        </div>
        <div>
          <div class="text-[10px] font-bold text-[#64748b]">BALLS BURNED</div>
          <div class="text-base font-black text-[#ea580c]">{game.totalBallsBurned}</div>
        </div>
        <div>
          <div class="text-[10px] font-bold text-[#64748b]">BEST</div>
          <div class="text-base font-black text-[#ca8a04]">{game.highScore.toLocaleString()}</div>
        </div>
      </div>
    </div>

    <!-- Action Buttons: Chunky Geometry Dash Sizing -->
    <div class="mt-6 flex flex-col gap-3">
      <button
        onclick={onRetry}
        class="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-[3px] border-[#181512] bg-[#facc15] font-mono text-lg font-black uppercase text-[#181512] shadow-[4px_4px_0px_#181512] transition-transform hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
      >
        <span>🔄 PLAY AGAIN</span>
      </button>

      <button
        onclick={onMenu}
        class="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#181512] bg-white font-mono text-sm font-black uppercase text-[#181512] shadow-[3px_3px_0px_#181512] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <span>◀ MAIN MENU</span>
      </button>
    </div>
  </div>
</div>
