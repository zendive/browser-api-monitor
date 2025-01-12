<script lang="ts">
  import type { TCancelIdleCallbackHistory } from '../../api/wrappers.ts';
  import {
    getSettings,
    setSettings,
    DEFAULT_SORT_CIC,
    type ESortOrder,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import Variable from './Variable.svelte';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import SortableColumn from './SortableColumn.svelte';

  let {
    metrics,
    caption = '',
  }: { metrics: TCancelIdleCallbackHistory[]; caption?: string } = $props();
  let sortField = $state(DEFAULT_SORT_CIC.field);
  let sortOrder = $state(DEFAULT_SORT_CIC.order);
  let sortedMetrics = $derived.by(() =>
    metrics.sort(compareByFieldOrder(sortField, sortOrder))
  );

  getSettings().then((settings) => {
    sortField = settings.sortCancelIdleCallback.field;
    sortOrder = settings.sortCancelIdleCallback.order;
  });

  function onChangeSort(_field: string, _order: ESortOrder) {
    sortField = <keyof TCancelIdleCallbackHistory>_field;
    sortOrder = _order;

    setSettings({
      sortCancelIdleCallback: {
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
        <td class="ta-c">{metric.calls}</td>
        <td class="ta-c">{metric.handler}</td>
      </tr>
    {/each}
  </tbody>
</table>
