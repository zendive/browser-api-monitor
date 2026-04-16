<script lang="ts">
  import { isMediaFieldWritable } from '../../../api/const.ts';
  import Variable from '../../shared/Variable.svelte';
  import { EMsg, portPost } from '../../../api/communication.ts';

  let { name, value, mediaId }: {
    name: string;
    value: unknown;
    mediaId: string;
  } = $props();

  function onToggleMediaField(field: string) {
    portPost({
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

<tr class:isPassive={!value} class:isActive={true === value}>
  <td class="name">{name}</td>
  <td class="value">
    {#if isMediaFieldWritable(name)}
      <button
        type="button"
        aria-label="Toggle state"
        class="isToggable"
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

<style lang="scss">
  .isPassive {
    color: var(--text-passive);
    font-weight: normal;
  }
  .isActive {
    font-weight: bold;
  }
  .isToggable {
    cursor: pointer;
  }
  .name {
    text-align: right;
  }
  .value {
    word-break: break-all;
    text-align: left;
  }
</style>
