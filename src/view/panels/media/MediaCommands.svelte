<script lang="ts">
  import type { TMediaCommand } from '../../../wrapper/MediaWrapper.ts';
  import { EMsg, postPort } from '../../../api/communication.ts';
  import { autoclick } from '../shared/directive.ts';

  let {
    mediaId,
    paused,
  }: {
    mediaId: string;
    paused: unknown;
  } = $props();
  const playPauseTitle = $derived.by(() =>
    paused ? `media.play()` : `media.pause()`
  );
  const playPauseIcon = $derived.by(() => paused ? '-play' : '-pause');

  function onMediaCommand(cmd: TMediaCommand) {
    postPort({ msg: EMsg.MEDIA_COMMAND, mediaId, cmd });
  }

  function onPlayPause() {
    if (paused) {
      postPort({ msg: EMsg.MEDIA_COMMAND, mediaId, cmd: 'play' });
    } else {
      postPort({ msg: EMsg.MEDIA_COMMAND, mediaId, cmd: 'pause' });
    }
  }
</script>

<span class="media-commands">
  <button
    type="button"
    onclick={() => void onMediaCommand('log')}
    title="console.log(media)"
    aria-label="console.log(media)"
  >
    <span class="icon -console"></span>
  </button>
  <button
    type="button"
    onclick={() => void onMediaCommand('locate')}
    title="media.scrollIntoView()"
    aria-label="media.scrollIntoView()"
  >
    <span class="icon -locate"></span>
  </button>
  <button
    type="button"
    onclick={() => void onMediaCommand('load')}
    title="media.load()"
    aria-label="media.load()"
  >
    <span class="icon -refresh"></span>
  </button>
  <button
    type="button"
    onclick={onPlayPause}
    title={playPauseTitle}
    aria-label={playPauseTitle}
  >
    <span class="icon {playPauseIcon}"></span>
  </button>
  <button
    use:autoclick
    type="button"
    onclick={() => void onMediaCommand('frame-backward')}
    title="Seek -16ms (hold to repeat)"
    aria-label="Seek -16ms (hold to repeat)"
  >
    <span class="icon -frame-backward"></span>
  </button>
  <button
    use:autoclick
    type="button"
    onclick={() => void onMediaCommand('frame-forward')}
    title="Seek +16ms (hold to repeat)"
    aria-label="Seek +16ms (hold to repeat)"
  >
    <span class="icon -frame-forward"></span>
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
