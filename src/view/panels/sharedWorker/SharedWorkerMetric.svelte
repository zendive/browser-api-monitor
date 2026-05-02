<script lang="ts">
  import WorkerSpecifier from '../shared/WorkerSpecifier.svelte';
  import CollapseExpand from '../shared/CollapseExpand.svelte';
  import SharedWorkerMetricConstructor from './SharedWorkerMetricConstructor.svelte';
  import type { ISharedWorkerTelemetryMetric } from '../../../wrapper/SharedWorkerWrapper.ts';

  let { workerMetric }: { workerMetric: ISharedWorkerTelemetryMetric } =
    $props();
  let isExpanded = $state(true);
</script>

<fieldset>
  <legend class="ta-r">
    <WorkerSpecifier specifier={workerMetric.specifier} />
    <!--{#if workerMetric.online}-->
    <!--  <span title="Active Workers">-->
    <!--    [<Variable value={workerMetric.online} />]-->
    <!--  </span>-->
    <!--{/if}-->
    <span class="divider"></span>
    <CollapseExpand
      {isExpanded}
      onClick={() => void (isExpanded = !isExpanded)}
    />
  </legend>

  <section class:d-none={!isExpanded}>
    <SharedWorkerMetricConstructor {workerMetric} />
  </section>
</fieldset>

<style lang="scss">
  fieldset {
    margin: 0.25rem auto;
  }
</style>
