<script lang="ts">
  import type { TActiveTimerMetrics } from '@/api/wrappers';
  import Variable from './Variable.svelte';
  import Callstack from './Callstack.svelte';
  import { IS_DEV } from '@/api/const';

  export let caption: string = '';
  export let metrics: TActiveTimerMetrics[] = [];

  $: metrics.sort((a, b) => b.delay - a.delay); // sort by delay descending
</script>

<table>
  <caption class="bc-invert ta-l"
    >{caption} <Variable bind:value={metrics.length} /></caption
  >
  <tr><th>Delay</th><th>Handler</th><th>Callstack</th></tr>
  {#each metrics as metric (metric.handler)}
    <tr class="t-zebra">
      <td class="ta-r">{metric.delay}</td>
      <td class="ta-c">
        {metric.handler}
      </td>
      <td>
        <Callstack bind:trace={metric.trace} />

        {#if IS_DEV && metric.rawTrace}
          <pre>{metric.rawTrace}</pre>
        {/if}
      </td>
    </tr>
  {/each}
</table>

<style lang="scss">
</style>
