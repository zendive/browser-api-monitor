<script lang="ts">
  import type { IWorkerTelemetryMetric } from '../../../wrapper/WorkerWrapper.ts';
  import WorkerSpecifier from '../shared/WorkerSpecifier.svelte';
  import CollapseExpand from '../shared/CollapseExpand.svelte';
  import WorkerMetricConstructor from './WorkerMetricConstructor.svelte';
  import WorkerMetricTerminate from './WorkerMetricTerminate.svelte';
  import WorkerMetricPostMessage from './WorkerMetricPostMessage.svelte';
  import WorkerMetricOnMessage from './WorkerMetricOnMessage.svelte';
  import WorkerMetricRemoveEventListener from './WorkerMetricRemoveEventListener.svelte';
  import WorkerMetricAddEventListener from './WorkerMetricAddEventListener.svelte';
  import WorkerMetricOnError from './WorkerMetricOnError.svelte';
  import Variable from '../../shared/Variable.svelte';

  let { workerMetric }: { workerMetric: IWorkerTelemetryMetric } = $props();
  let isExpanded = $state(true);
</script>

<fieldset>
  <legend class="ta-r">
    <WorkerSpecifier specifier={workerMetric.specifier} />
    {#if workerMetric.online}
      <span title="Active Workers">
        [<Variable value={workerMetric.online} />]
      </span>
    {/if}
    <span class="divider"></span>
    <CollapseExpand
      {isExpanded}
      onClick={() => void (isExpanded = !isExpanded)}
    />
  </legend>

  <section class:d-none={!isExpanded}>
    <WorkerMetricConstructor {workerMetric} />
    <WorkerMetricTerminate metrics={workerMetric.terminate} />
    <WorkerMetricPostMessage metrics={workerMetric.postMessage} />
    <WorkerMetricOnMessage metrics={workerMetric.onmessage} />
    <WorkerMetricOnError metrics={workerMetric.onerror} />
    <WorkerMetricAddEventListener metrics={workerMetric.ael} />
    <WorkerMetricRemoveEventListener metrics={workerMetric.rel} />
  </section>
</fieldset>

<style lang="scss">
  fieldset {
    margin: 0.25rem auto;
  }
</style>
