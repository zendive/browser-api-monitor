<script lang="ts">
  import type { TOnlineTimerMetrics } from '@/api/wrappers';
  import Variable from './Variable.svelte';
  import Callstack from './Callstack.svelte';
  import { IS_DEV } from '@/api/const';
  import {
    EVENT_CS_COMMAND,
    portPost,
    type TCsClearHandler,
  } from '@/api/communication';

  export let caption: string = '';
  export let metrics: TOnlineTimerMetrics[] = [];

  $: metrics.sort((a, b) => b.delay - a.delay); // sort by delay descending

  function onRemoveHandler(metric: TOnlineTimerMetrics) {
    portPost(EVENT_CS_COMMAND, <TCsClearHandler>{
      operator: 'clear-timer-handler',
      type: metric.type,
      handler: metric.handler,
    });
  }
</script>

<table>
  <caption class="bc-invert ta-l"
    >{caption} <Variable bind:value={metrics.length} /></caption
  >
  <tr><th>Delay</th><th>Handler</th><th>Callstack</th></tr>
  {#each metrics as metric (metric.handler)}
    <tr class="t-zebra">
      <td class="ta-r">{metric.delay}</td>
      <td class="ta-c handler-cell">
        <span class="handler-value">{metric.handler}</span>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <span
          class="icon -remove -small"
          role="button"
          tabindex="-1"
          title="Cancel"
          on:click={() => onRemoveHandler(metric)}
        />
      </td>
      <td class="wb-all">
        <Callstack bind:trace={metric.trace} />
        {#if IS_DEV && metric.rawTrace}
          <pre>{metric.rawTrace}</pre>
        {/if}
      </td>
    </tr>
  {/each}
</table>

<style lang="scss">
  .handler-cell {
    .icon.-remove {
      display: none;
      cursor: pointer;
    }
    &:hover {
      .handler-value {
        display: none;
      }
      .icon.-remove {
        display: inline-block;
      }
    }
  }
</style>
