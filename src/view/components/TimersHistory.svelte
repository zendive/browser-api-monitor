<script lang="ts">
  import type { TTimerHistory } from '@/api/wrappers';
  import Variable from './Variable.svelte';
  import Callstack from './Callstack.svelte';

  export let caption: string = '';
  export let metrics: TTimerHistory[] = [];
</script>

<table class="w-full">
  <caption class="bc-invert ta-l"
    >{caption} <Variable bind:value={metrics.length} /></caption
  >
  <tr><th>Callstack</th><th>Called</th><th>Handler</th><th>Delay</th></tr>
  {#each metrics as metric (metric.traceId)}
    <tr
      class="t-zebra"
      class:bc-error={typeof metric.recentHandler !== 'number' ||
        metric.recentHandler < 1}
    >
      <td class="wb-all"><Callstack bind:trace={metric.trace} /></td>
      <td class="ta-c"
        ><Variable bind:value={metric.individualInvocations} /></td
      >
      <td class="ta-c">{metric.recentHandler}</td>
      <td class="ta-r">{metric.handlerDelay}</td>
    </tr>
  {/each}
</table>

<style lang="scss">
</style>
