<script lang="ts">
  import type { TRequestAnimationFrameHistory } from '../../api/wrappers.ts';
  import {
    DEFAULT_SORT_RAF,
    getSettings,
    setSettings,
    ESortOrder,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import { Stopper } from '../../api/time.ts';
  import Variable from './Variable.svelte';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import SortableColumn from './SortableColumn.svelte';

  let {
    metrics,
    caption = '',
  }: { metrics: TRequestAnimationFrameHistory[]; caption: string } = $props();
  let sortField = $state(DEFAULT_SORT_RAF.field);
  let sortOrder = $state(DEFAULT_SORT_RAF.order);
  let sortedMetrics = $derived.by(() =>
    metrics.sort(compareByFieldOrder(sortField, sortOrder))
  );

  getSettings().then((settings) => {
    sortField = settings.sortRequestAnimationFrame.field;
    sortOrder = settings.sortRequestAnimationFrame.order;
  });

  function onChangeSort(_field: string, _order: ESortOrder) {
    sortField = <keyof TRequestAnimationFrameHistory>_field;
    sortOrder = _order;

    setSettings({
      sortRequestAnimationFrame: {
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
      <th class="shaft"></th>
      <th class="w-full">Callstack</th>
      <th class="ta-c">
        <SortableColumn
          field="selfTime"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}>Self</SortableColumn
        >
      </th>
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
    </tr>

    {#each sortedMetrics as metric (metric.traceId)}
      <tr class="t-zebra">
        <td><TraceDomain traceDomain={metric.traceDomain} /></td>
        <td class="wb-all">
          <Trace trace={metric.trace} traceId={metric.traceId} />
        </td>
        <td class="ta-r">{Stopper.toString(metric.selfTime)}</td>
        <td class="ta-c">{metric.calls}</td>
        <td class="ta-c">{metric.handler}</td>
      </tr>
    {/each}
  </tbody>
</table>
