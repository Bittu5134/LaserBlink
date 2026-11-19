<script lang="ts">
  let booted = $state(true);
</script>

<main class="min-h-dvh p-6">
  <div class="neo-card mx-auto max-w-3xl p-8">
    <p class="neo-label">Cabinet check</p>
    <h1 class="mt-2 font-display text-6xl font-extrabold tracking-tight">AFTERIMAGE</h1>
    <p class="mt-3 font-mono text-sm">Cream, ink, lemon. No glow.</p>
    {#if booted}
      <button class="neo-btn neo-btn-primary mt-6 px-5 py-3" onclick={() => (booted = false)}>
        Kill the lights
      </button>
    {/if}
  </div>
</main>
