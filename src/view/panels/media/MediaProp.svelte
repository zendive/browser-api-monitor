<script lang="ts">
  import { isMediaFieldWritable } from '../../../api/const.ts';
  import Variable from '../../shared/Variable.svelte';
  import { EMsg, postPort } from '../../../api/communication.ts';
  import MediaPropVolume from './MediaPropVolume.svelte';
  import MediaPropPlaybackRate from './MediaPropPlaybackRate.svelte';

  let { name, value, mediaId }: {
    name: string;
    value: unknown;
    mediaId: string;
  } = $props();

  function onToggleMediaField(field: string) {
    postPort({
      msg: EMsg.MEDIA_COMMAND,
      mediaId: mediaId,
      cmd: 'toggle-boolean',
      field: field as keyof HTMLMediaElement,
    });
  }

  function isVariableMediaProp(label: string) {
    return ['networkState', 'readyState'].includes(label);
  }

  function propValueFilter(value: unknown) {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return value;
  }
</script>

{#if name === 'volume'}
  <MediaPropVolume {mediaId} {value} />
{:else if name === 'playbackRate'}
  <MediaPropPlaybackRate {mediaId} {value} />
{:else}
  <tr class:isPassive={!value}>
    <td class="ta-r">{name}</td>
    <td class="value ta-l">
      {#if isMediaFieldWritable(name)}
        <button
          type="button"
          aria-label="Toggle state"
          onclick={() => void onToggleMediaField(name)}
        >
          {value}
        </button>
      {:else if isVariableMediaProp(name)}
        <Variable {value} />
      {:else}
        {propValueFilter(value)}
      {/if}
    </td>
  </tr>
{/if}

<style lang="scss">
  .isPassive {
    color: var(--text-passive);
    font-weight: normal;
  }

  .value {
    padding-left: 0.25rem;
    word-break: break-all;

    button {
      color: inherit;
      padding: 0;
      font-size: 100%;
    }
  }
</style>
