<script lang="ts">
  import type { TMetrics } from '@/cs-main';
  import Variable from './Variable.svelte';
  import Callstack from './Callstack.svelte';

  export let metrics: TMetrics['evalMetrics'] = {
    totalInvocations: 0,
    evalHistory: [],
  };

  function dynamicValue(value: unknown): string {
    if (value === '⟪undefined⟫') {
      return '';
    } else if (typeof value === 'string') {
      return value;
    } else if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }
</script>

<table>
  <caption class="bc-invert ta-l"
    >Eval Usages <Variable bind:value={metrics.totalInvocations} /></caption
  >
  <tr
    ><th>Callstack</th><th>Calls</th><th>Recent Code</th><th>Recent Return</th
    ></tr
  >
  {#each metrics.evalHistory as metric (metric.traceId)}
    <tr class="t-zebra">
      <td><Callstack bind:trace={metric.trace} /></td>
      <td class="ta-c">
        <Variable bind:value={metric.individualInvocations} />
      </td>
      <td class="limit-width">
        <div class="code">{dynamicValue(metric.code)}</div>
      </td>
      <td class="limit-width">
        <div class="code">{dynamicValue(metric.returnedValue)}</div>
      </td>
    </tr>
  {/each}
</table>

<style lang="scss">
  .limit-width {
    max-width: 12rem;
  }

  .code {
    max-width: 12rem;
    display: -webkit-box;
    max-width: 200px;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
