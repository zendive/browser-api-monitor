<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import SharedWorkerMetric from './SharedWorkerMetric.svelte';
  import type { ESortOrder } from '../../../api/const.ts';
  import type {
    ISharedWorkerTelemetry,
    ISharedWorkerTelemetryMetric,
  } from '../../../wrapper/SharedWorkerWrapper.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';

  let { telemetry }: { telemetry: ISharedWorkerTelemetry } = $props();
  const { sortSharedWorkerPanel } = useConfigState();
  const sortedCollection = $derived.by(() =>
    telemetry.collection.toSorted(
      compareByFieldOrder(
        sortSharedWorkerPanel.field,
        sortSharedWorkerPanel.order,
      ),
    )
  );

  function updateSort(
    field: keyof ISharedWorkerTelemetryMetric,
    order: ESortOrder,
  ) {
    sortSharedWorkerPanel.field = field;
    sortSharedWorkerPanel.order = order;
    saveLocalStorage({ sortSharedWorkerPanel });
  }
</script>

{#if sortedCollection.length}
  <section data-navigation-tag="_SharedWorker">
    <div class="label bc-invert">
      <ColumnSortable
        sort={sortSharedWorkerPanel}
        by="firstSeen"
        update={updateSort}
      >
        SharedWorker [<Variable value={sortedCollection.length} />]
      </ColumnSortable>
    </div>

    {#each sortedCollection as metric (metric.specifier)}
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
