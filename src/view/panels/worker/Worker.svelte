<script lang="ts">
  import type { IWorkerTelemetry } from '../../../wrapper/WorkerWrapper.ts';
  import Variable from '../../shared/Variable.svelte';
  import WorkerMetric from './WorkerMetric.svelte';

  let { telemetry }: { telemetry: IWorkerTelemetry } = $props();
</script>

{#if telemetry.collection.length}
  <section data-navigation-tag="Worker">
    <div class="label bc-invert sticky-header">
      Worker [<Variable value={telemetry.collection.length} />]
    </div>

    {#each telemetry.collection as metric (metric.specifier)}
      <WorkerMetric {metric} />
    {/each}
  </section>
{/if}

<style lang="scss">
  .label {
    display: flex;
    align-items: center;
    font-weight: bold;
    width: 100%;
    height: 1.125rem;
  }
</style>
