<script lang="ts">
  import type { TOnlineTimerMetrics } from '@/api/wrappers.ts';
  import Variable from '@/view/components/Variable.svelte';
  import Callstack from '@/view/components/Callstack.svelte';
  import { IS_DEV } from '@/api/env.ts';
  import { portPost } from '@/api/communication.ts';

  export let caption: string = '';
  export let metrics: TOnlineTimerMetrics[] = [];

  // sort by delay descending
  $: metrics.sort((a, b) => {
    const aDelay = a.delay || 0;
    const bDelay = b.delay || 0;
    return bDelay > aDelay ? 1 : bDelay < aDelay ? -1 : 0;
  });

  function onRemoveHandler(metric: TOnlineTimerMetrics) {
    portPost({
      msg: 'clear-timer-handler',
      type: metric.type,
      handler: metric.handler,
    });
  }
</script>

<table data-navigation-tag={caption}>
  <caption class="bc-invert ta-l"
    >{caption} <Variable bind:value={metrics.length} /></caption
  >
  <tr><th>Delay</th><th>Handler</th><th class="w-full">Callstack</th></tr>
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
          on:click={() => void onRemoveHandler(metric)}
        />
      </td>
      <td class="wb-all w-full">
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
