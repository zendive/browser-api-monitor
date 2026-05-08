<script lang="ts">
  import WorkerSpecifier from '../shared/WorkerSpecifier.svelte';
  import CollapseExpand from '../shared/CollapseExpand.svelte';
  import SharedWorkerMetricConstructor from './SharedWorkerMetricConstructor.svelte';
  import SharedWorkerMetricOnError from './SharedWorkerMetricOnError.svelte';
  import SharedWorkerMetricPortStart from './SharedWorkerMetricPortStart.svelte';
  import SharedWorkerMetricPortClose from './SharedWorkerMetricPortClose.svelte';
  import type { ISharedWorkerTelemetryMetric } from '../../../wrapper/SharedWorkerWrapper.ts';

  let { workerMetric }: { workerMetric: ISharedWorkerTelemetryMetric } =
    $props();
  let isExpanded = $state(true);
</script>

<fieldset>
  <legend class="ta-r">
    <WorkerSpecifier
      specifier={workerMetric.specifier}
      inMemory={workerMetric.inMemory}
    />
    <span class="divider"></span>
    <CollapseExpand
      {isExpanded}
      onClick={() => void (isExpanded = !isExpanded)}
    />
  </legend>

  <section class:d-none={!isExpanded}>
    <SharedWorkerMetricConstructor {workerMetric} />
    <SharedWorkerMetricOnError metrics={workerMetric.onerror} />
    <SharedWorkerMetricPortStart metrics={workerMetric.portStart} />
    <SharedWorkerMetricPortClose metrics={workerMetric.portClose} />
  </section>
</fieldset>

<style lang="scss">
  fieldset {
    margin: 0.25rem auto;
  }
</style>
