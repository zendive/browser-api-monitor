<script lang="ts">
  import type { TOnlineTimerMetrics } from '../../wrapper/TimerWrapper.ts';
  import { EMsg, portPost } from '../../api/communication.ts';
  import { msToHms } from '../../api/time.ts';
  import Variable from './Variable.svelte';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';

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
  <caption class="bc-invert ta-l">
    {caption} <Variable value={metrics.length} />
  </caption>
  <tbody>
    <tr>
      <th>Delay</th>
      <th>Handler</th>
      <th class="w-full">Callstack</th>
    </tr>

    {#each metrics as metric (metric.handler)}
      <tr class="t-zebra">
        <td class="ta-r" title={msToHms(metric.delay)}>{metric.delay}</td>
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
        <td class="wb-all w-full">
          <TraceDomain traceDomain={metric.traceDomain} />
          <Trace trace={metric.trace} />
        </td>
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
