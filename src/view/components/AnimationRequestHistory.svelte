<script lang="ts">
  import type { TRequestAnimationFrameHistory } from '../../api/wrappers.ts';
  import {
    DEFAULT_SORT,
    getSettings,
    setSettings,
    HistorySortField,
    type THistorySortField,
    type TSortOrder,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import { Stopper } from '../../api/time.ts';
  import Variable from './Variable.svelte';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import TimersHistoryCellSort from './TimersHistoryCellSort.svelte';

  let {
    metrics,
    caption = '',
  }: { metrics: TRequestAnimationFrameHistory[]; caption?: string } = $props();
  let field = $state(DEFAULT_SORT.timersHistoryField);
  let order = $state(DEFAULT_SORT.timersHistoryOrder);
  let sortedMetrics = $derived.by(() =>
    metrics.sort(
      compareByFieldOrder(<keyof TRequestAnimationFrameHistory>field, order)
    )
  );

  getSettings().then((settings) => {
    field = settings.sort.timersHistoryField;
    order = settings.sort.timersHistoryOrder;
  });

  function onChangeSort(_field: THistorySortField, _order: TSortOrder) {
    field = _field;
    order = _order;

    setSettings({
      sort: {
        timersHistoryField: $state.snapshot(_field),
        timersHistoryOrder: $state.snapshot(_order),
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
        <TimersHistoryCellSort
          field={HistorySortField.selfTime}
          currentField={field}
          currentFieldOrder={order}
          eventChangeSorting={onChangeSort}>Self</TimersHistoryCellSort
        >
      </th>
      <th class="ta-c">
        <TimersHistoryCellSort
          field={HistorySortField.calls}
          currentField={field}
          currentFieldOrder={order}
          eventChangeSorting={onChangeSort}>Called</TimersHistoryCellSort
        >
      </th>
      <th class="ta-c">
        <TimersHistoryCellSort
          field={HistorySortField.handler}
          currentField={field}
          currentFieldOrder={order}
          eventChangeSorting={onChangeSort}>Handler</TimersHistoryCellSort
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
