<script lang="ts">
  import type { IWorkerTelemetryMetric } from '../../../wrapper/WorkerWrapper.ts';
  import WorkerSpecifier from './WorkerSpecifier.svelte';
  import CollapseExpand from './CollapseExpand.svelte';
  import WorkerMetricConstructor from './WorkerMetricConstructor.svelte';
  import WorkerMetricTerminate from './WorkerMetricTerminate.svelte';
  import WorkerMetricPostMessage from './WorkerMetricPostMessage.svelte';
  import WorkerMetricOnMessage from './WorkerMetricOnMessage.svelte';
  import WorkerMetricRemoveEventListener from './WorkerMetricRemoveEventListener.svelte';
  import WorkerMetricAddEventListener from './WorkerMetricAddEventListener.svelte';
  import WorkerMetricOnError from './WorkerMetricOnError.svelte';
  import Variable from '../../shared/Variable.svelte';

  let { metric }: { metric: IWorkerTelemetryMetric } = $props();
  let isExpanded = $state(true);
</script>

<fieldset>
  <legend class="ta-r">
    <WorkerSpecifier specifier={metric.specifier} />
    {#if metric.online}
      [<Variable value={metric.online} />]
    {/if}
    <span class="divider"></span>
    <CollapseExpand
      {isExpanded}
      onClick={() => void (isExpanded = !isExpanded)}
    />
  </legend>

  <section class:d-none={!isExpanded}>
    <WorkerMetricConstructor {metric} />
    <WorkerMetricTerminate {metric} />
    <WorkerMetricPostMessage {metric} />
    <WorkerMetricOnMessage {metric} />
    <WorkerMetricOnError {metric} />
    <WorkerMetricAddEventListener {metric} />
    <WorkerMetricRemoveEventListener {metric} />
  </section>
</fieldset>

<style lang="scss">
  fieldset {
    margin: 0.25rem auto;
  }
</style>
