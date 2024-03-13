<script lang="ts">
  import Variable from './Variable.svelte';
  import Callstack from './Callstack.svelte';
  import type { TEvalHistory } from '@/api/wrappers';

  export let callCount: number = 0;
  export let metrics: TEvalHistory[] = [];

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
  <caption class="bc-error ta-l"
    >Eval Usages <Variable bind:value={callCount} /></caption
  >
  <tr
    ><th>Callstack</th><th>Risk</th><th>Called</th><th>Code</th><th>Returns</th
    ></tr
  >
  {#each metrics as metric (metric.traceId)}
    <tr class="t-zebra">
      <td class="wb-all"><Callstack bind:trace={metric.trace} /></td>
      <td>
        {#if metric.usesLocalScope}
          <span
            title="Has access to parent scope AND tried to use local scope context variable (which was prevented)"
            >HIGH</span
          >
        {:else}
          <span
            title="Has access to parent scope, didn't tried to access local scope variable"
            >NORMAL</span
          >
        {/if}
      </td>
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
