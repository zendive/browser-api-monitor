<script lang="ts">
  import {
    EMsg,
    type IMsgMediaCommand,
    portPost,
  } from '../../../api/communication.ts';

  let { mediaId }: { mediaId: string } = $props();

  function onMediaCommand(cmd: IMsgMediaCommand['cmd']) {
    portPost({ msg: EMsg.MEDIA_COMMAND, mediaId, cmd });
  }
</script>

<span class="media-commands">
  <button
    onclick={() => void onMediaCommand('log')}
    title="console.log(media)"
    aria-label="console.log(media)"
  >
    <span class="icon -console"></span>
  </button>
  <button
    onclick={() => void onMediaCommand('locate')}
    title="media.scrollIntoView()"
    aria-label="media.scrollIntoView()"
  >
    <span class="icon -locate"></span>
  </button>
  <button
    onclick={() => void onMediaCommand('load')}
    title="media.load()"
    aria-label="media.load()"
  >
    <span class="icon -refresh"></span>
  </button>
  <button
    onclick={() => void onMediaCommand('play')}
    title="media.play()"
    aria-label="media.play()"
  >
    <span class="icon -play"></span>
  </button>
  <button
    onclick={() => void onMediaCommand('pause')}
    title="media.pause()"
    aria-label="media.pause()"
  >
    <span class="icon -pause"></span>
  </button>
  <button
    onclick={() => void onMediaCommand('frame-backward')}
    title="Seek -16ms"
    aria-label="Seek -16ms"
  >
    <span class="icon -frame-backward"></span>
  </button>
  <button
    onclick={() => void onMediaCommand('frame-forward')}
    title="Seek +16ms"
    aria-label="Seek +16ms"
  >
    <span class="icon -frame-forward"></span>
  </button>
  <button
    onclick={() => void onMediaCommand('slower')}
    title="Speed -10%"
    aria-label="Speed -10%"
  >
    <span class="icon -slower"></span>
  </button>
  <button
    onclick={() => void onMediaCommand('faster')}
    title="Speed +10%"
    aria-label="Speed +10%"
  >
    <span class="icon -faster"></span>
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
