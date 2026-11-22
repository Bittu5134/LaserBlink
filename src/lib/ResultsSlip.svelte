<script lang="ts">
  import { game } from '../game/gameState.svelte';
  import Icon from './Icon.svelte';

  const result = $derived(game.results);
</script>

{#if result}
  <aside class="result-mark" class:is-failed={!result.passed} aria-label={`Page result: ${result.grade}`}>
    <div class="grade-line">
      <strong>{result.grade}</strong>
      <span class="stars" aria-label={`${result.stars} of 3 stars`}>
        {#each Array(3) as _, index}
          <span class:star-empty={index >= result.stars}>
            <Icon name="star" size={19} strokeWidth={1.2} />
          </span>
        {/each}
      </span>
    </div>

    <dl class="result-stats">
      <div>
        <dt>Hits</dt>
        <dd>{result.hits}/{result.requiredHits}</dd>
      </div>
      <div>
        <dt>Score</dt>
        <dd class="score-gain">+{result.score.toLocaleString()}</dd>
      </div>
    </dl>
  </aside>
{/if}

<style>
  .result-mark {
    position: fixed;
    z-index: 11;
    top: clamp(10px, 2vh, 18px);
    left: 50%;
    translate: -50% 0;
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 6px 14px;
    border: 1px solid rgba(251, 244, 227, 0.16);
    border-radius: 2px;
    background: rgba(24, 16, 10, 0.9);
    color: var(--color-paper);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.62);
    pointer-events: none;
    animation: var(--animate-slip-in);
  }

  .grade-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .grade-line strong {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 2.6vw, 2.1rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    color: #ffe0cd;
    transform: rotate(-1.5deg);
  }

  .result-mark.is-failed .grade-line strong {
    color: #ffb694;
  }

  .stars {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--color-laser);
  }

  .stars span {
    display: inline-flex;
  }

  .stars .star-empty {
    color: rgba(251, 244, 227, 0.28);
  }

  .result-stats {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 0;
  }

  .result-stats > div {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .result-stats dt {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    opacity: 0.68;
  }

  .result-stats dd {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1;
  }

  .score-gain {
    color: #ffe0cd;
  }

  @media (max-width: 900px) {
    .result-mark {
      top: auto;
      bottom: 126px;
      left: 12px;
      right: 12px;
      translate: 0 0;
      flex-wrap: wrap;
      gap: 8px 16px;
    }
  }
</style>
