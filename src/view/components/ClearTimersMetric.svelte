<script lang="ts">
  import type { TClearTimerMetrics } from '@/api/wrappers';
  import Variable from './Variable.svelte';
  import Callstack from './Callstack.svelte';

  export let caption: string = '';
  export let metrics: TClearTimerMetrics[] = [];
</script>

<table>
  <caption class="bc-invert ta-l"
    >{caption} <Variable bind:value={metrics.length} /></caption
  >
  <tr><th>Callstack</th><th>Calls</th><th>Handler</th><th>Delay</th></tr>
  {#each metrics as metric}
    <tr
      class:bc-error={typeof metric.recentHandler !== 'number' ||
        metric.recentHandler < 1}
    >
      <td><Callstack bind:trace={metric.trace} /></td>
      <td class="ta-c"
        ><Variable bind:value={metric.individualInvocations} /></td
      >
      <td class="ta-c"><Variable bind:value={metric.recentHandler} /></td>
      <td class="ta-r">{metric.handlerDelay}</td>
    </tr>
  {/each}
</table>

<style lang="scss">
  tr:nth-child(even) {
    background-color: var(--bg-table-even);
  }
</style>
