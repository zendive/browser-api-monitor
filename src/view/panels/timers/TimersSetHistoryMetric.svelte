<script lang="ts">
  import {
    SetTimerFacts,
    type TClearTimerHistory,
    type TSetTimerHistory,
  } from '../../../wrapper/TimerWrapper.ts';
  import CellFrameTimeSensitive from '../shared/CellFrameTimeSensitive.svelte';
  import Variable from '../../shared/Variable.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import Dialog from '../../shared/Dialog.svelte';
  import Alert from '../../shared/Alert.svelte';
  import TimersClearHistory from './TimersClearHistory.svelte';
  import CellCancelable from '../shared/CellCancelable.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import { delayTooltip } from '../../../devtoolsPanelUtil.ts';

  let {
    metric,
    clearTimeoutHistory,
    clearIntervalHistory,
  }: {
    metric: TSetTimerHistory;
    clearTimeoutHistory: TClearTimerHistory[] | null;
    clearIntervalHistory: TClearTimerHistory[] | null;
  } = $props();
  let dialogEl: Dialog | null = null;
  let alertEl: Alert | null = null;
  let clearTimerHistoryMetrics: TClearTimerHistory[] = $state([]);

  function onFindRegressors(regressors: string[] | null) {
    if (!dialogEl || !alertEl || !regressors?.length) {
      return;
    }

    for (let n = regressors.length - 1; n >= 0; n--) {
      const traceId = regressors[n];
      let record = clearTimeoutHistory?.find((r) => r.traceId === traceId);

      if (record) {
        clearTimerHistoryMetrics.push(record);
      }

      record = clearIntervalHistory?.find((r) => r.traceId === traceId);
      if (record) {
        clearTimerHistoryMetrics.push(record);
      }
    }

    if (clearTimerHistoryMetrics.length) {
      dialogEl.show();
    } else {
      alertEl.show();
    }
  }

  function onCloseDialog() {
    clearTimerHistoryMetrics.splice(0);
  }
</script>

<Dialog
  bind:this={dialogEl}
  eventClose={onCloseDialog}
  title="Places from which timer with current callstack was prematurely canceled"
  description="The information is actual only on time of demand. For full coverage - requires both clearTimeout and clearInterval panels enabled."
>
  <TimersClearHistory
    caption="Canceled by"
    clearTimerHistory={$state.snapshot(clearTimerHistoryMetrics)}
  />
</Dialog>

<Alert bind:this={alertEl} title="Attention">
  Requires both clearTimeout and clearInterval panels enabled
</Alert>

<tr class="t-zebra">
  <td class="wb-all">
    <CellCallstack
      trace={metric.trace}
      traceDomain={metric.traceDomain}
    />
  </td>
  <td class="ta-r">
    <CellFrameTimeSensitive value={metric.selfTime} />
  </td>
  <td class="ta-c">
    <CellFacts facts={metric.facts} factsMap={SetTimerFacts} />
  </td>
  <td class="ta-c">
    <CellCancelable
      calls={metric.calls}
      canceledCounter={metric.canceledCounter}
      canceledByTraceIds={metric.canceledByTraceIds}
      onClick={onFindRegressors}
    />
  </td>
  <td class="ta-c">{metric.handler}</td>
  <td class="ta-r" title={delayTooltip(metric.delay)}>{metric.delay}</td>
  <td class="ta-r">
    {#if metric.online}
      <Variable value={metric.online} />
    {/if}
  </td>
  <td><CellBypass traceId={metric.traceId} /></td>
  <td><CellBreakpoint traceId={metric.traceId} /></td>
</tr>
