<script lang="ts">
  import {
    RicFact,
    type TCancelIdleCallbackHistory,
    type TRequestIdleCallbackHistory,
  } from '../../wrapper/IdleWrapper.ts';
  import {
    DEFAULT_SORT_RIC,
    ESortOrder,
    getSettings,
    setSettings,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import { msToHms } from '../../api/time.ts';
  import Variable from '../components/Variable.svelte';
  import IdleCallbackCancelHistory from './IdleCallbackCancelHistory.svelte';
  import Dialog from '../components/Dialog.svelte';
  import Alert from '../components/Alert.svelte';
  import SortableColumn from './components/SortableColumn.svelte';
  import FrameSensitiveTime from './components/FrameSensitiveTime.svelte';
  import TraceBreakpoint from './components/TraceBreakpoint.svelte';
  import TraceBypass from './components/TraceBypass.svelte';
  import CancelableCallMetric from './components/CancelableCallMetric.svelte';
  import type { TFactsMap } from '../../wrapper/Fact.ts';
  import FactsCell from './components/FactsCell.svelte';
  import CallstackCell from './components/CallstackCell.svelte';

  let {
    ricHistory,
    cicHistory = null,
    caption = '',
  }: {
    ricHistory: TRequestIdleCallbackHistory[];
    cicHistory: TCancelIdleCallbackHistory[] | null;
    caption: string;
  } = $props();
  let sortField = $state(DEFAULT_SORT_RIC.field);
  let sortOrder = $state(DEFAULT_SORT_RIC.order);
  let dialogEl: Dialog | null = null;
  let alertEl: Alert | null = null;
  let sortedMetrics = $derived.by(() =>
    ricHistory.toSorted(compareByFieldOrder(sortField, sortOrder))
  );
  const RicFacts: TFactsMap = new Map([
    [RicFact.BAD_DELAY, {
      tag: 'D',
      details: 'Delay is not a positive number or undefined',
    }],
  ]);

  getSettings().then((settings) => {
    sortField = settings.sortRequestIdleCallback.field;
    sortOrder = settings.sortRequestIdleCallback.order;
  });

  function onChangeSort(_field: string, _order: ESortOrder) {
    sortField = <keyof TRequestIdleCallbackHistory> _field;
    sortOrder = _order;

    setSettings({
      sortRequestIdleCallback: {
        field: $state.snapshot(sortField),
        order: $state.snapshot(sortOrder),
      },
    });
  }

  let cicHistoryMetrics: TCancelIdleCallbackHistory[] = $state([]);

  function onFindRegressors(regressors: string[] | null) {
    if (!dialogEl || !alertEl || !regressors?.length) {
      return;
    }

    for (let n = regressors.length - 1; n >= 0; n--) {
      const traceId = regressors[n];
      let record = cicHistory?.find((r) => r.traceId === traceId);
      if (record) {
        cicHistoryMetrics.push(record);
      }
    }

    if (cicHistoryMetrics.length) {
      dialogEl.show();
    } else {
      alertEl.show();
    }
  }

  function onCloseDialog() {
    cicHistoryMetrics.splice(0);
  }
</script>

<Dialog
  bind:this={dialogEl}
  eventClose={onCloseDialog}
  title="Places from which requestIdleCallback with current callstack was prematurely canceled"
  description="The information is actual only on time of demand. Requires cancelIdleCallback panel enabled."
>
  <IdleCallbackCancelHistory
    caption="Canceled by"
    cicHistory={$state.snapshot(cicHistoryMetrics)}
  />
</Dialog>

<Alert bind:this={alertEl} title="Attention">
  Requires cancelIdleCallback panel enabled
</Alert>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        {caption} Callstack [<Variable value={ricHistory.length} />]
      </th>
      <th class="ta-c">didTimeout</th>
      <th class="ta-r">
        <SortableColumn
          field="selfTime"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Self</SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="facts"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        ><span class="icon -facts"></span></SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="calls"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Called</SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="handler"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Handler</SortableColumn>
      </th>
      <th class="ta-r">
        <SortableColumn
          field="delay"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Delay</SortableColumn>
      </th>
      <th>
        <SortableColumn
          field="online"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Set</SortableColumn>
      </th>
      <th title="Bypass"><span class="icon -bypass"></span></th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <tr class="t-zebra">
        <td class="wb-all">
          <CallstackCell
            trace={metric.trace}
            traceDomain={metric.traceDomain}
          />
        </td>
        <td class="ta-c">{metric.didTimeout}</td>
        <td class="ta-r"><FrameSensitiveTime value={metric.selfTime} /></td>
        <td class="ta-c">
          <FactsCell facts={metric.facts} factsMap={RicFacts} />
        </td>
        <td class="ta-c">
          <CancelableCallMetric
            calls={metric.calls}
            canceledCounter={metric.canceledCounter}
            canceledByTraceIds={metric.canceledByTraceIds}
            onClick={onFindRegressors}
          />
        </td>
        <td class="ta-c"><Variable value={metric.handler} /></td>
        <td class="ta-r" title={msToHms(metric.delay)}>{metric.delay}</td>
        <td class="ta-r">
          {#if metric.online}
            <Variable value={metric.online} />
          {/if}
        </td>
        <td><TraceBypass traceId={metric.traceId} /></td>
        <td><TraceBreakpoint traceId={metric.traceId} /></td>
      </tr>
    {/each}
  </tbody>
</table>
