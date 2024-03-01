<script lang="ts">
  import type { TMetrics } from '@/cs-main';
  import Variable from './Variable.svelte';
  import Callstack from './Callstack.svelte';

  export let metrics: TMetrics['evalMetrics'] = {
    totalInvocations: 0,
    usages: [],
  };
</script>

<table>
  <caption class="bc-invert ta-l"
    >Eval Usages <Variable bind:value={metrics.totalInvocations} /></caption
  >
  <tr><th>Callstack</th><th>Calls</th><th>Code</th><th>Returned Value</th></tr>
  {#each metrics.usages as metric}
    <tr>
      <td><Callstack bind:trace={metric.trace} /></td>
      <td class="ta-c">
        <Variable bind:value={metric.individualInvocations} />
      </td>
      <td class="limit-width">
        <div class="code">{metric.code}</div>
      </td>
      <td class="limit-width">
        <div class="code">{JSON.stringify(metric.returnedValue)}</div>
      </td>
    </tr>
  {/each}
</table>

<style lang="scss">
  tr:nth-child(even) {
    background-color: var(--bg-table-even);
  }

  .limit-width {
    max-width: 12rem;
  }

  .code {
    max-height: 12rem;
    max-width: 12rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
