<script lang="ts">
  import Variable from '@/view/components/Variable.svelte';
  import Callstack from '@/view/components/Callstack.svelte';
  import type { TEvalHistory } from '@/api/wrappers.ts';

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

{#if metrics.length}
  <table>
    <caption class="ta-l bc-invert"
      >Eval Usages <Variable bind:value={callCount} /></caption
    >
    <tr
      ><th class="w-full">Callstack</th><th>Scope</th><th>Called</th><th
        >Code</th
      ><th>Returns</th></tr
    >
    {#each metrics as metric (metric.traceId)}
      <tr class="t-zebra bc-error">
        <td class="wb-all"><Callstack bind:trace={metric.trace} /></td>
        <td>
          {#if metric.usesLocalScope}
            <span
              title="Throwed an error while trying to get local scope variables, return value is unreliable"
              >LOCAL & GLOBAL</span
            >
          {:else}
            <span
              title="Had access to global scope (local scope usage has not been detected)"
              >GLOBAL</span
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
{/if}

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
