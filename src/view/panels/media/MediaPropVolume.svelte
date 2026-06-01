<script lang="ts">
  import { EMsg, postPort } from '../../../api/communication.ts';

  let { mediaId, value }: {
    mediaId: string;
    value: unknown;
  } = $props();

  function onChangeVolume(e: Event) {
    postPort({
      msg: EMsg.MEDIA_COMMAND,
      cmd: 'set-volume',
      mediaId,
      value: (e.target as HTMLInputElement).valueAsNumber,
    });
  }
</script>

<tr>
  <td class="ta-r">volume</td>
  <td class="ta-l">
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      oninput={onChangeVolume}
      {value}
    />

    {value}
  </td>
</tr>
