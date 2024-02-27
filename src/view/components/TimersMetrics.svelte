<script lang="ts">
  import type { TTimerMetrics } from '@/api/wrappers';
  import Variable from './Variable.svelte';
  import CallstackLink from './CallstackLink.svelte';
  import { IS_DEV } from '@/api/const';

  export let metrics: TTimerMetrics[] = [];
</script>

<table>
  <tr><th>Delay</th><th>Handler</th><th>Callstack</th></tr>
  {#each metrics as metric}
    <tr>
      <td class="delay">{metric.delay}</td>
      <td class="handler"><Variable bind:value={metric.handler} /></td>
      <td>
        {#each metric.trace as stack, index}
          {#if index > 0}
            &nbsp;|
          {/if}<CallstackLink bind:href={stack.link} bind:name={stack.name} />
        {/each}

        {#if IS_DEV && metric.rawTrace?.length}
          <pre>{metric.rawTrace}</pre>
        {/if}
      </td>
    </tr>
  {/each}
</table>

<style lang="scss">
  tr:nth-child(even) {
    background-color: rgb(30% 30% 30% / 10%);
  }
  .delay {
    text-align: right;
  }
  .handler {
    text-align: center;
  }
</style>
