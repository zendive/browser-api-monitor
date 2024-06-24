<script lang="ts">
  import { portPost, type TMsgMediaCommand } from '@/api/communication.ts';

  export let mediaId: string;

  function onMediaCommand(cmd: TMsgMediaCommand['cmd']) {
    portPost({ msg: 'media-command', mediaId, cmd });
  }
</script>

<span class="media-commands">
  <button
    on:click={() => void onMediaCommand('log')}
    title="console.log(media)"
  >
    <span class="icon -console" />
  </button>
  <button
    on:click={() => void onMediaCommand('locate')}
    title="media.scrollIntoView()"
  >
    <span class="icon -locate" />
  </button>
  <button on:click={() => void onMediaCommand('load')} title="media.load()">
    <span class="icon -refresh" />
  </button>
  <button on:click={() => void onMediaCommand('play')} title="media.play()">
    <span class="icon -play" />
  </button>
  <button on:click={() => void onMediaCommand('pause')} title="media.pause()">
    <span class="icon -pause" />
  </button>
  <button on:click={() => void onMediaCommand('frame-backward')} title="-16ms">
    <span class="icon -frame-backward" />
  </button>
  <button on:click={() => void onMediaCommand('frame-forward')} title="+16ms">
    <span class="icon -frame-forward" />
  </button>
</span>

<style lang="scss">
  button {
    border-right-color: var(--text-invert);
    .icon {
      background-color: var(--text-invert);
    }
  }
</style>
