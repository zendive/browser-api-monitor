<script lang="ts">
  import type { TOnlineTimerMetrics } from '../../../wrapper/TimerWrapper.ts';
  import { EMsg, portPost } from '../../../api/communication.ts';
  import Variable from '../../shared/Variable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import { delayTooltip } from '../../../devtoolsPanelUtil.ts';

  let {
    metrics,
    caption = '',
  }: { metrics: TOnlineTimerMetrics[]; caption?: string } = $props();

  function onRemoveHandler(metric: TOnlineTimerMetrics) {
    portPost({
      msg: EMsg.TIMER_COMMAND,
      type: metric.type,
      handler: metric.handler,
    });
  }
</script>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        {caption} Callstack [<Variable value={metrics.length} />]
      </th>
      <th class="ta-c">Handler</th>
      <th class="ta-r">Delay</th>
    </tr>
  </thead>

  <tbody>
    {#each metrics as metric (metric.handler)}
      <tr class="t-zebra">
        <td class="wb-all w-full">
          <CellCallstack
            trace={metric.trace}
            traceDomain={metric.traceDomain}
          />
        </td>
        <td class="ta-c handler-cell">
          <span class="handler-value">{metric.handler}</span>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <span
            class="icon -clear -small"
            role="button"
            tabindex="-1"
            title="Cancel"
            onclick={() => void onRemoveHandler(metric)}
          ></span>
        </td>
        <td class="ta-r" title={delayTooltip(metric.delay)}>{metric.delay}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style lang="scss">
  .handler-cell {
    .icon {
      display: none;
      cursor: pointer;
    }
    &:hover {
      .handler-value {
        display: none;
      }
      .icon {
        display: inline-block;
      }
    }
  }
</style>
