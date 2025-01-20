<script lang="ts">
  import type {
    TClearTimerHistory,
    TSetTimerHistory,
  } from '../../wrapper/main.ts';
  import { CALLED_ABORTED_TOOLTIP } from '../../api/const.ts';
  import { delayTitle } from '../../api/time.ts';
  import FrameSensitiveTime from './FrameSensitiveTime.svelte';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import Variable from './Variable.svelte';
  import TraceBypass from './TraceBypass.svelte';
  import TraceBreakpoint from './TraceBreakpoint.svelte';
  import Dialog from './Dialog.svelte';
  import Alert from './Alert.svelte';
  import TimersClearHistory from './TimersClearHistory.svelte';

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
    metrics={$state.snapshot(clearTimerHistoryMetrics)}
  />
</Dialog>

<Alert bind:this={alertEl} title="Attention">
  Requires both clearTimeout and clearInterval panels enabled
</Alert>

<tr class="t-zebra">
  <td class="wb-all">
    <TraceDomain traceDomain={metric.traceDomain} />
    <Trace trace={metric.trace} />
  </td>
  <td class="ta-r">
    <FrameSensitiveTime value={metric.selfTime} />
  </td>
  <td class="ta-c">
    <Variable value={metric.calls} />{#if metric.canceledCounter}-<a
        role="button"
        href="void(0)"
        title={CALLED_ABORTED_TOOLTIP}
        onclick={(e) => {
          e.preventDefault();
          onFindRegressors(metric.canceledByTraceIds);
        }}
        ><Variable value={metric.canceledCounter} />/{metric.canceledByTraceIds
          ?.length}
      </a>
    {/if}
  </td>
  <td class="ta-c"><Variable value={metric.handler} /></td>
  <td class="ta-r" title={delayTitle(metric.delay)}>{metric.delay}</td>
  <td class="ta-r">
    {#if metric.online}
      <Variable value={metric.online} />
    {/if}
  </td>
  <td><TraceBypass traceId={metric.traceId} /></td>
  <td><TraceBreakpoint traceId={metric.traceId} /></td>
</tr>
