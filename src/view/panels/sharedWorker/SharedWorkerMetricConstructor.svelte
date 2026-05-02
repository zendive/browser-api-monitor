<script lang="ts">
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import Variable from '../../shared/Variable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CollapseExpand from '../shared/CollapseExpand.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import type { ESortOrder } from '../../../api/const.ts';
  import type {
    ISharedWorkerConstructorMetric,
    ISharedWorkerTelemetryMetric,
  } from '../../../wrapper/SharedWorkerWrapper.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';

  let { workerMetric }: { workerMetric: ISharedWorkerTelemetryMetric } =
    $props();
  const { sortSharedWorkerConstructor } = useConfigState();
  const constructorSortedMetrics = $derived.by(() =>
    workerMetric.konstruktor.toSorted(
      compareByFieldOrder(
        sortSharedWorkerConstructor.field,
        sortSharedWorkerConstructor.order,
      ),
    )
  );
  let isExpanded = $state(true);

  function onChangeSort(field: string, order: ESortOrder) {
    sortSharedWorkerConstructor.field =
      <keyof ISharedWorkerConstructorMetric> field;
    sortSharedWorkerConstructor.order = order;

    saveLocalStorage({
      sortSharedWorkerConstructor: $state.snapshot(sortSharedWorkerConstructor),
    });
  }
</script>

<table>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        <CollapseExpand
          class="bc-invert"
          {isExpanded}
          onClick={() => void (isExpanded = !isExpanded)}
        />
        <ColumnSortable
          field="firstSeen"
          currentField={sortSharedWorkerConstructor.field}
          currentFieldOrder={sortSharedWorkerConstructor.order}
          eventChangeSorting={onChangeSort}
        >
          constructor [<Variable value={constructorSortedMetrics.length} />]
        </ColumnSortable>
      </th>
      <th class="ta-c">name</th>
      <th class="ta-c" title="classic | module">type</th>
      <th class="ta-c" title="same-origin | include | omit ">credentials</th>
      <th class="ta-c" title="sameSiteCookies: all | none ">sSC</th>
      <th class="ta-c">
        <ColumnSortable
          field="calls"
          currentField={sortSharedWorkerConstructor.field}
          currentFieldOrder={sortSharedWorkerConstructor.order}
          eventChangeSorting={onChangeSort}
        >Called</ColumnSortable>
      </th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>
  </thead>

  <tbody class:d-none={!isExpanded}>
    {#each constructorSortedMetrics as metric (metric.traceId)}
      <tr class="t-zebra">
        <td class="wb-all">
          <CellCallstack
            trace={metric.trace}
            traceDomain={metric.traceDomain}
          />
        </td>
        <td class="ta-c worker-name">{metric.options.name}</td>
        <td class="ta-c">{metric.options.type}</td>
        <td class="ta-c">{metric.options.credentials}</td>
        <td class="ta-c">{metric.options.sameSiteCookies}</td>
        <td class="ta-c"><Variable value={metric.calls} /></td>
        <td><CellBreakpoint traceId={metric.traceId} /></td>
      </tr>
    {/each}
  </tbody>
</table>
