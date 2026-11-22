<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
  let sheet = $state<HTMLElement | null>(null);

  onMount(() => {
    sheet?.focus();
  });

  function backdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) onClose();
  }
</script>

<div class="modal-veil" onclick={backdropClick} role="presentation">
  <div
    bind:this={sheet}
    class="modal-sheet"
    role="dialog"
    aria-modal="true"
    aria-labelledby="help-title"
    tabindex="-1"
  >
    <header class="help-head">
      <h2 id="help-title">How to play</h2>
      <button class="icon-btn" type="button" onclick={onClose} title="Close help (Escape)" aria-label="Close help">
        <Icon name="close" size={19} />
      </button>
    </header>

    <ul class="help-steps">
      <li><strong>Study</strong> the targets before they blink away.</li>
      <li><strong>Drag</strong> to aim. Shift is a fine step.</li>
      <li><strong>Trace</strong> spends one ink for the full line. Three a page.</li>
      <li><strong>Fire</strong> once. Hit the quota or lose a mistake.</li>
    </ul>

    <div class="controls-block">
      <p class="label">Keys</p>
      <dl class="control-list">
        <div><dt><span class="key">Space</span></dt><dd>Start, fire, next</dd></div>
        <div><dt><span class="key">&larr;</span> <span class="key">&rarr;</span> / <span class="key">A</span> <span class="key">D</span></dt><dd>Aim, Shift fine</dd></div>
        <div><dt><span class="key">I</span></dt><dd>Trace ink</dd></div>
        <div><dt>Right-click</dt><dd>Fire</dd></div>
        <div><dt><span class="key">M</span></dt><dd>Sound</dd></div>
        <div><dt><span class="key">V</span></dt><dd>Reduced motion</dd></div>
        <div><dt><span class="key">F</span></dt><dd>Fullscreen</dd></div>
        <div><dt><span class="key">Esc</span></dt><dd>Close help</dd></div>
      </dl>
    </div>

    <button class="btn btn-primary close-btn" type="button" onclick={onClose}>
      Close
    </button>
  </div>
</div>

<style>
  .modal-veil {
    position: fixed;
    inset: 0;
    z-index: 70;
    display: grid;
    place-items: center;
    padding: 16px;
    overflow-y: auto;
    background: rgba(8, 6, 4, 0.72);
    backdrop-filter: blur(3px);
  }

  .modal-sheet {
    width: min(100%, 560px);
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
    padding: clamp(20px, 3.5vw, 30px);
    background: var(--color-paper);
    border: 1px solid var(--color-ink-soft);
    box-shadow:
      0 40px 80px -30px rgba(0, 0, 0, 0.85),
      0 6px 16px rgba(0, 0, 0, 0.3);
    animation: var(--animate-pop-in);
  }

  .modal-sheet:focus {
    outline: none;
  }

  .help-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--color-ink);
  }

  .help-head h2 {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 4.6vw, 2.25rem);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }

  .help-steps {
    display: grid;
    gap: 0;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
  }

  .help-steps li {
    padding: 10px 0;
    border-bottom: 1px dashed var(--color-rule);
    font-size: 1rem;
    line-height: 1.45;
    color: var(--color-ink-soft);
  }

  .help-steps strong {
    color: var(--color-ink);
    font-weight: 700;
  }

  .controls-block {
    margin-top: 16px;
  }

  .control-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 18px;
    margin: 7px 0 0;
  }

  .control-list > div {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .control-list dt {
    flex: 0 0 auto;
  }

  .control-list dd {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.4;
    color: var(--color-ink-soft);
  }

  .close-btn {
    width: 100%;
    margin-top: 18px;
    min-height: 50px;
  }

  @media (max-width: 480px) {
    .control-list {
      grid-template-columns: 1fr;
    }
  }
</style>
