<script lang="ts">
  import type { TOnlineTimerMetrics } from '../../../wrapper/TimerWrapper.ts';
  import Variable from '../../shared/Variable.svelte';
  import OnlineTimerMetric from './OnlineTimerMetric.svelte';

  let {
    metrics,
    caption,
  }: {
    metrics: TOnlineTimerMetrics[];
    caption: string;
  } = $props();
</script>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        {caption} Callstack [<Variable value={metrics.length} />]
      </th>
      <th class="ta-c">Handler</th>
      <th class="ta-r">Delay</th>
    </tr>
  </thead>

  <tbody>
    {#each metrics as metric (metric.handler)}
      <OnlineTimerMetric {metric} />
    {/each}
  </tbody>
</table>
