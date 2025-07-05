<script lang="ts">
  import type { IWorkerTelemetry } from '../../../wrapper/WorkerWrapper.ts';
  import Variable from '../../shared/Variable.svelte';
  import WorkerMetric from './WorkerMetric.svelte';

  let { telemetry }: { telemetry: IWorkerTelemetry } = $props();
  const hardwareConcurrency = globalThis.navigator.hardwareConcurrency;
  let showTotalOnlineWarning = $derived.by(() =>
    telemetry.totalOnline > hardwareConcurrency
  );
</script>

{#if telemetry.collection.length}
  <section data-navigation-tag="Worker History">
    <div class="label bc-invert sticky-header">
      Worker History [<Variable value={telemetry.collection.length} />]

      {#if showTotalOnlineWarning}
        <span class="divider"></span>
        <span class="tc-attention">
          Total number of running workers exceeds number of available CPUs [{
            hardwareConcurrency
          }]
        </span>
      {/if}
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
