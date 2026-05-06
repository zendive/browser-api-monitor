<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import WorkerMetric from './WorkerMetric.svelte';
  import type { ESortOrder } from '../../../api/const.ts';
  import type {
    IWorkerTelemetry,
    IWorkerTelemetryMetric,
  } from '../../../wrapper/WorkerWrapper.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';

  let { telemetry }: { telemetry: IWorkerTelemetry } = $props();
  const { sortWorkerPanel } = useConfigState();
  const sortedCollection = $derived.by(() =>
    telemetry.collection.toSorted(
      compareByFieldOrder(sortWorkerPanel.field, sortWorkerPanel.order),
    )
  );

  function updateSort(field: keyof IWorkerTelemetryMetric, order: ESortOrder) {
    sortWorkerPanel.field = field;
    sortWorkerPanel.order = order;
    saveLocalStorage({ sortWorkerPanel });
  }
</script>

{#if sortedCollection.length}
  <section data-navigation-tag="_Worker">
    <div class="label bc-invert">
      <ColumnSortable
        sort={sortWorkerPanel}
        by="firstSeen"
        update={updateSort}
      >
        Worker [<Variable value={sortedCollection.length} />]
      </ColumnSortable>
    </div>

    {#each sortedCollection as metric (metric.specifier)}
      <WorkerMetric workerMetric={metric} />
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
