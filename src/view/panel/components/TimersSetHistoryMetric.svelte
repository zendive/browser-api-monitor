<script lang="ts">
  import {
    SetTimerFact,
    type TClearTimerHistory,
    type TSetTimerHistory,
  } from '../../../wrapper/TimerWrapper.ts';
  import { msToHms } from '../../../api/time.ts';
  import FrameSensitiveTime from './FrameSensitiveTime.svelte';
  import Variable from '../../components/Variable.svelte';
  import TraceBypass from './TraceBypass.svelte';
  import TraceBreakpoint from './TraceBreakpoint.svelte';
  import Dialog from '../../components/Dialog.svelte';
  import Alert from '../../components/Alert.svelte';
  import TimersClearHistory from '../TimersClearHistory.svelte';
  import CancelableCallMetric from './CancelableCallMetric.svelte';
  import type { TFactsMap } from '../../../wrapper/Fact.ts';
  import FactsCell from './FactsCell.svelte';
  import CallstackCell from './CallstackCell.svelte';

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
  const SetTimerFacts: TFactsMap = new Map([
    [SetTimerFact.NOT_A_FUNCTION, {
      tag: 'C',
      details: 'Callback is not a function',
    }],
    [SetTimerFact.BAD_DELAY, {
      tag: 'D',
      details: 'Delay is not a positive number or undefined',
    }],
  ]);

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
    <CallstackCell
      trace={metric.trace}
      traceDomain={metric.traceDomain}
    />
  </td>
  <td class="ta-r">
    <FrameSensitiveTime value={metric.selfTime} />
  </td>
  <td class="ta-c">
    <FactsCell facts={metric.facts} factsMap={SetTimerFacts} />
  </td>
  <td class="ta-c">
    <CancelableCallMetric
      calls={metric.calls}
      canceledCounter={metric.canceledCounter}
      canceledByTraceIds={metric.canceledByTraceIds}
      onClick={onFindRegressors}
    />
  </td>
  <td class="ta-c">{metric.handler}</td>
  <td class="ta-r" title={msToHms(metric.delay)}>{metric.delay}</td>
  <td class="ta-r">
    {#if metric.online}
      <Variable value={metric.online} />
    {/if}
  </td>
  <td><TraceBypass traceId={metric.traceId} /></td>
  <td><TraceBreakpoint traceId={metric.traceId} /></td>
</tr>
