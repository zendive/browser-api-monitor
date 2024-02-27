<script lang="ts">
  import type { TMetrics } from '@/cs-main';
  import Variable from './Variable.svelte';
  import StackTraceLink from './StackTraceLink.svelte';

  export let timers: TMetrics['timers'];
  export let timersUsages: TMetrics['timersUsages'];
</script>

{#each timers as api}
  <div>
    {#if api.invocations}
      <strong>{api.name}:</strong>
      <Variable bind:value={api.invocations} />
      {#if api.name === 'setTimeout'}
        [<Variable bind:value={timersUsages.timeouts.length} />]
        {#each timersUsages.timeouts as v}
          <li>
            {v[0]}, [{#each v[1] as stack, index}
              {#if index > 0}|{/if}<StackTraceLink
                bind:href={stack.link}
                bind:name={stack.name}
              />{/each}]
          </li>
        {/each}
      {/if}
      {#if api.name === 'setInterval'}
        [<Variable bind:value={timersUsages.intervals.length} />]
        {#each timersUsages.intervals as v}
          <li>
            {v[0]}, [{#each v[1] as stack, index}
              {#if index > 0}|{/if}<StackTraceLink
                bind:href={stack.link}
                bind:name={stack.name}
              />{/each}]
          </li>
        {/each}
      {/if}
    {/if}
  </div>
{/each}
