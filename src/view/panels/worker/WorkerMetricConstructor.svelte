<script lang="ts">
import CellBreakpoint from '../shared/CellBreakpoint.svelte';
import Variable from '../../shared/Variable.svelte';
import CellCallstack from '../shared/CellCallstack.svelte';
import {
  type IWorkerConstructorMetric,
  type IWorkerTelemetryMetric,
  WorkerConstructorFacts,
} from '../../../wrapper/WorkerWrapper.ts';
import CollapseExpand from '../shared/CollapseExpand.svelte';
import CellFacts from '../shared/CellFacts.svelte';
import { useConfigState } from '../../../state/config.state.svelte.ts';
import { compareByFieldOrder } from '../shared/comparator.ts';
import type { ESortOrder } from '../../../api/const.ts';
import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
import ColumnSortable from '../shared/ColumnSortable.svelte';

let { workerMetric }: { workerMetric: IWorkerTelemetryMetric } = $props();
const { sortWorkerConstructor } = useConfigState();
const constructorSortedMetrics = $derived.by(() =>
  workerMetric.konstruktor.toSorted(
    compareByFieldOrder(
      sortWorkerConstructor.field,
      sortWorkerConstructor.order,
    ),
  )
);
let isExpanded = $state(true);

function updateSort(
  field: keyof IWorkerConstructorMetric,
  order: ESortOrder,
) {
  sortWorkerConstructor.field = field;
  sortWorkerConstructor.order = order;
  saveLocalStorage({ sortWorkerConstructor });
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
          sort={sortWorkerConstructor}
          by="firstSeen"
          update={updateSort}
        >
          constructor [<Variable value={constructorSortedMetrics.length} />]
        </ColumnSortable>
      </th>
      <th class="ta-c">name</th>
      <th class="ta-c" title="classic | module">type</th>
      <th class="ta-c" title="same-origin | include | omit ">credentials</th>
      <th class="ta-c" title="Fact"><span class="icon -facts"></span></th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortWorkerConstructor}
          by="calls"
          update={updateSort}
        >Called</ColumnSortable>
      </th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>
  </thead>

  <tbody class:d-none={!isExpanded}>
    {#each constructorSortedMetrics as {
      traceId,
      trace,
      options,
      calls
    } (traceId)}
      <tr class="t-zebra">
        <td class="wb-all">
          <CellCallstack trace={trace} />
        </td>
        <td class="ta-c">
          <div class="worker-name" title={options.name}>{options.name}</div>
        </td>
        <td class="ta-c">
          <span title={options.type}>{options.type === 'module'? 'M': 'C'}</span>
        </td>
        <td class="ta-c">{options.credentials}</td>
        <td class="ta-c">
          <CellFacts
            facts={workerMetric.facts}
            factsMap={WorkerConstructorFacts}
          />
        </td>
        <td class="ta-c"><Variable value={calls} /></td>
        <td><CellBreakpoint traceId={traceId} /></td>
      </tr>
    {/each}
  </tbody>
</table>
