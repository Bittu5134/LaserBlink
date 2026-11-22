<script lang="ts">
  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
  <div class="relative w-full max-w-lg rounded-2xl border-[4px] border-[#181512] bg-[#fdf8e6] p-6 text-left shadow-[8px_8px_0px_#181512] sm:p-8">
    <!-- Header -->
    <div class="flex items-center justify-between border-b-2 border-[#181512] pb-3">
      <div class="flex items-center gap-2 font-mono text-xl font-black uppercase text-[#181512]">
        <span>🔥</span>
        <span>HOW TO PLAY LASERBLINK</span>
      </div>
      <button
        onclick={onClose}
        class="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#181512] bg-white font-mono text-base font-black text-[#181512] shadow-[2px_2px_0px_#181512] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
      >
        ✕
      </button>
    </div>

    <!-- 3 Rules Steps -->
    <div class="my-5 flex flex-col gap-3 font-mono">
      <div class="flex gap-3 rounded-xl border-2 border-[#181512] bg-white p-3 shadow-[2px_2px_0px_#181512]">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fef08a] font-black text-[#854d0e]">
          1
        </div>
        <div>
          <div class="text-xs font-black uppercase text-[#dc2626]">MEMORIZE THE PAPER BALLS</div>
          <div class="mt-0.5 text-xs text-[#4b5563]">
            Crumpled paper balls appear on the scratchpad paper. You have a few seconds to memorize their spots before they vanish!
          </div>
        </div>
      </div>

      <div class="flex gap-3 rounded-xl border-2 border-[#181512] bg-white p-3 shadow-[2px_2px_0px_#181512]">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fef08a] font-black text-[#854d0e]">
          2
        </div>
        <div>
          <div class="text-xs font-black uppercase text-[#ca8a04]">BLINK & AIM OFF THE EDGES</div>
          <div class="mt-0.5 text-xs text-[#4b5563]">
            The balls disappear! Drag or use arrow keys to aim your laser pointer. The beam reflects off the walls up to the bounce limit.
          </div>
        </div>
      </div>

      <div class="flex gap-3 rounded-xl border-2 border-[#181512] bg-white p-3 shadow-[2px_2px_0px_#181512]">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fef08a] font-black text-[#854d0e]">
          3
        </div>
        <div>
          <div class="text-xs font-black uppercase text-[#16a34a]">FIRE, BURN & MULTI-COMBO</div>
          <div class="mt-0.5 text-xs text-[#4b5563]">
            Press SPACE or FIRE! The laser surges forward, reveals the hidden balls, and scorches them to ash. Burning multiple balls gives huge combo multipliers!
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Box -->
    <div class="rounded-xl border-2 border-[#181512] bg-[#f8fafc] p-3 font-mono text-xs shadow-[2px_2px_0px_#181512]">
      <div class="font-black text-[#334155] uppercase">KEYBOARD CONTROLS</div>
      <div class="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[#475569]">
        <div><span class="rounded border border-[#cbd5e1] bg-white px-1.5 py-0.5 font-bold">SPACE</span> Fire / Next Round</div>
        <div><span class="rounded border border-[#cbd5e1] bg-white px-1.5 py-0.5 font-bold">← → / A D</span> Fine-tune Aim</div>
        <div><span class="rounded border border-[#cbd5e1] bg-white px-1.5 py-0.5 font-bold">M</span> Toggle Sound</div>
        <div><span class="rounded border border-[#cbd5e1] bg-white px-1.5 py-0.5 font-bold">ESC</span> Exit to Menu</div>
      </div>
    </div>

    <!-- Close button -->
    <div class="mt-5">
      <button
        onclick={onClose}
        class="flex h-11 w-full items-center justify-center rounded-xl border-[3px] border-[#181512] bg-[#facc15] font-mono text-sm font-black uppercase text-[#181512] shadow-[3px_3px_0px_#181512] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        GOT IT, LET'S PLAY!
      </button>
    </div>
  </div>
</div>
