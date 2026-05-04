<script lang="ts">
  import type { ISharedWorkerTelemetry } from '../../../wrapper/SharedWorkerWrapper.ts';
  import Variable from '../../shared/Variable.svelte';
  import SharedWorkerMetric from './SharedWorkerMetric.svelte';

  let { telemetry }: { telemetry: ISharedWorkerTelemetry } = $props();
</script>

{#if telemetry.collection.length}
  <section data-navigation-tag="_SharedWorker">
    <div class="label bc-invert">
      SharedWorker [<Variable value={telemetry.collection.length} />]
    </div>

    {#each telemetry.collection as metric (metric.specifier)}
      <SharedWorkerMetric workerMetric={metric} />
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
