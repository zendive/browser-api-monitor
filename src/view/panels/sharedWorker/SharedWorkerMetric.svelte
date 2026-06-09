<script lang="ts">
  import type { ISharedWorkerTelemetryMetric } from '../../../wrapper/SharedWorkerWrapper.ts';
  import WorkerSpecifier from '../shared/WorkerSpecifier.svelte';
  import CollapseExpand from '../shared/CollapseExpand.svelte';
  import SharedWorkerMetricConstructor from './SharedWorkerMetricConstructor.svelte';
  import SharedWorkerMetricOnError from './SharedWorkerMetricOnError.svelte';
  import SharedWorkerMetricPortStart from './SharedWorkerMetricPortStart.svelte';
  import SharedWorkerMetricPortClose from './SharedWorkerMetricPortClose.svelte';
  import SharedWorkerMetricPortPostMessage from './SharedWorkerMetricPortPostMessage.svelte';
  import SharedWorkerMetricPortAel from './SharedWorkerMetricPortAel.svelte';
  import SharedWorkerMetricPortRel from './SharedWorkerMetricPortRel.svelte';

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
    <SharedWorkerMetricPortPostMessage metrics={workerMetric.portPostMessage} />
    <SharedWorkerMetricPortAel metrics={workerMetric.portAel} />
    <SharedWorkerMetricPortRel metrics={workerMetric.portRel} />
  </section>
</fieldset>

<style lang="scss">
  fieldset {
    margin: 0.25rem auto;
  }
</style>
