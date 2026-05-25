<script lang="ts">
  import type { IMediaEventMetrics } from '../../../wrapper/MediaWrapper.ts';
  import Variable from '../../shared/Variable.svelte';

  let { metric }: { metric: IMediaEventMetrics } = $props();
  const hasListeners = $derived.by(() =>
    metric.ael.length || metric.rel.length
  );
</script>

<tr class:isPassive={0 === metric.calls} class:isActive={0 !== metric.calls}>
  <td class="ta-r">
    {#if hasListeners}
      <strong>ƒ</strong>
    {/if}
    {metric.name}
  </td>
  <td class="ta-l value"><Variable value={metric.calls} /></td>
</tr>

<style lang="scss">
  .isPassive {
    color: var(--text-passive);
    font-weight: normal;
  }
  .isActive {
    font-weight: bold;
  }
  .value {
    margin-left: 1rem;
  }
</style>
