<script lang="ts">
  type IconName =
    | 'sound'
    | 'mute'
    | 'motion'
    | 'home'
    | 'fullscreen'
    | 'help'
    | 'close'
    | 'ink'
    | 'fire'
    | 'play'
    | 'next'
    | 'star';

  interface Props {
    name: IconName;
    size?: number;
    strokeWidth?: number;
  }

  let { name, size = 18, strokeWidth = 2.2 }: Props = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {#if name === 'sound'}
    <path d="M4 9.5v5h3l4.5 3.5v-12L7 9.5H4Z" />
    <path d="M15 9a4.2 4.2 0 0 1 0 6" />
    <path d="M17.8 6.5a8 8 0 0 1 0 11" />
  {:else if name === 'mute'}
    <path d="M4 9.5v5h3l4.5 3.5v-12L7 9.5H4Z" />
    <path d="m15.5 9.5 5 5m0-5-5 5" />

  {:else if name === 'motion'}
    <path d="M9 6.5v11M15 6.5v11" />
  {:else if name === 'home'}
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.5Z" />
    <path d="M9.5 20v-5.5h5V20" />
  {:else if name === 'fullscreen'}
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  {:else if name === 'help'}
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.7 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1.1.9-1.1 1.6v.3" />
    <path d="M12 17.1h.01" />
  {:else if name === 'close'}
    <path d="m6 6 12 12M18 6 6 18" />
  {:else if name === 'ink'}
    <path d="M12 3.5c2.6 3.2 5.4 6.2 5.4 9.4a5.4 5.4 0 0 1-10.8 0c0-3.2 2.8-6.2 5.4-9.4Z" />


  {:else if name === 'fire'}
    <path d="M13 3.5c.4 3-2 4.6-3.3 6.3-1 1.3-.7 2.5.5 3.2-.1-1.6.8-2.8 2.1-3.5-.2 2.7 2.2 3.3 2.2 5.9a4.5 4.5 0 0 1-9 0c0-2.2 1.2-4 2.6-5.7C10.3 7.2 12.6 5.6 13 3.5Z" />



  {:else if name === 'play'}
    <path d="M8 5.5 19 12 8 18.5v-13Z" />
  {:else if name === 'next'}
    <path d="M4 12h15m-6-6 6 6-6 6" />

  {:else if name === 'star'}
    <path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.6Z" fill="currentColor" stroke="none" />
  {/if}
</svg>
