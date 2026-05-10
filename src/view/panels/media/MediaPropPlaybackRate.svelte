<script lang="ts">
  import { EMsg, postPort } from '../../../api/communication';

  let { mediaId, value }: {
    mediaId: string;
    value: unknown;
  } = $props();

  function onChangePlaybackRate(e: Event) {
    postPort({
      msg: EMsg.MEDIA_COMMAND,
      cmd: 'set-playbackRate',
      mediaId,
      value: (e.target as HTMLInputElement).valueAsNumber,
    });
  }
</script>

<tr>
  <td class="ta-r">playbackRate</td>
  <td class="ta-l">
    <input
      type="range"
      min="0.25"
      max="4.0"
      step="0.01"
      oninput={onChangePlaybackRate}
      {value}
    />

    {value}
  </td>
</tr>
