<script lang="ts">
  import type { TTimerMetrics } from '@/api/wrappers';
  import Variable from './Variable.svelte';
  import Callstack from './Callstack.svelte';
  import { IS_DEV } from '@/api/const';

  export let caption: string = '';
  export let metrics: TTimerMetrics[] = [];
</script>

<table>
  <caption class="bc-invert ta-l"
    >{caption} <Variable bind:value={metrics.length} /></caption
  >
  <tr><th>Delay</th><th>Handler</th><th>Callstack</th></tr>
  {#each metrics as metric}
    <tr>
      <td class="ta-r">{metric.delay}</td>
      <td class="ta-c"><Variable bind:value={metric.handler} /></td>
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
  tr:nth-child(even) {
    background-color: var(--bg-table-even);
  }
</style>
