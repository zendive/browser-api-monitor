<script lang="ts">
  import type { TCancelAnimationFrameHistory } from '../../api/wrappers.ts';
  import {
    DEFAULT_SORT_CAF,
    getSettings,
    setSettings,
    ESortOrder,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import Variable from './Variable.svelte';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import SortableColumn from './SortableColumn.svelte';
  import TraceBreakpoint from './TraceBreakpoint.svelte';
  import TraceBypass from './TraceBypass.svelte';

  let {
    metrics,
    caption = '',
  }: { metrics: TCancelAnimationFrameHistory[]; caption?: string } = $props();
  let sortField = $state(DEFAULT_SORT_CAF.field);
  let sortOrder = $state(DEFAULT_SORT_CAF.order);
  let sortedMetrics = $derived.by(() =>
    metrics.sort(compareByFieldOrder(sortField, sortOrder))
  );

  getSettings().then((settings) => {
    sortField = settings.sortCancelAnimationFrame.field;
    sortOrder = settings.sortCancelAnimationFrame.order;
  });

  function onChangeSort(_field: string, _order: ESortOrder) {
    sortField = <keyof TCancelAnimationFrameHistory>_field;
    sortOrder = _order;

    setSettings({
      sortCancelAnimationFrame: {
        field: $state.snapshot(sortField),
        order: $state.snapshot(sortOrder),
      },
    });
  }
</script>

<table data-navigation-tag={caption}>
  <caption class="bc-invert ta-l">
    {caption}
    <Variable value={metrics.length} />
  </caption>
  <tbody>
    <tr>
      <th class="w-full">Callstack</th>
      <th class="ta-c">
        <SortableColumn
          field="calls"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}>Called</SortableColumn
        >
      </th>
      <th class="ta-c">
        <SortableColumn
          field="handler"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}>Handler</SortableColumn
        >
      </th>
      <th title="Bypass"><span class="icon -bypass"></span></th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>

    {#each sortedMetrics as metric (metric.traceId)}
      <tr class="t-zebra">
        <td class="wb-all">
          <TraceDomain traceDomain={metric.traceDomain} />
          <Trace trace={metric.trace} />
        </td>
        <td class="ta-c"><Variable value={metric.calls} /></td>
        <td class="ta-c"><Variable value={metric.handler} /></td>
        <td><TraceBypass traceId={metric.traceId} /></td>
        <td><TraceBreakpoint traceId={metric.traceId} /></td>
      </tr>
    {/each}
  </tbody>
</table>
