<script lang="ts">
  import type { TMetrics } from '../../api-monitor-cs-main.ts';
  import {
    DEFAULT_PANELS,
    getSettings,
    onSettingsChange,
    panelsArrayToVisibilityMap,
    type TPanelVisibilityMap,
  } from '../../api/settings.ts';
  import InfoBarItem from './InfoBarItem.svelte';

  let { msg }: { msg: TMetrics } = $props();

  let panels: TPanelVisibilityMap = $state.raw(
    panelsArrayToVisibilityMap(DEFAULT_PANELS)
  );

  getSettings().then((settings) => {
    panels = panelsArrayToVisibilityMap(settings.panels);

    onSettingsChange((newValue) => {
      panels = panelsArrayToVisibilityMap(newValue.panels);
    });
  });
</script>


  <InfoBarItem
    label="eval"
    navSelector="Eval History"
    panel={panels.eval}
    count={msg.wrapperMetrics.callCounter.eval}
  />

  <InfoBarItem
    label="Media"
    navSelector="Videos|Audios"
    panel={panels.media}
    count={msg.mediaMetrics.total}
  />

  <InfoBarItem
    label="Active Timers"
    navSelector="Active"
    panel={panels.activeTimers}
    count={msg.wrapperMetrics.callCounter.activeTimers}
  />

  <InfoBarItem
    label="setTimeout"
    navSelector="setTimeout History"
    panel={panels.setTimeout}
    count={msg.wrapperMetrics.callCounter.setTimeout}
  />

  <InfoBarItem
    label="clearTimeout"
    navSelector="clearTimeout History"
    panel={panels.clearTimeout}
    count={msg.wrapperMetrics.callCounter.clearTimeout}
  />

  <InfoBarItem
    label="setInterval"
    navSelector="setInterval History"
    panel={panels.setInterval}
    count={msg.wrapperMetrics.callCounter.setInterval}
  />

  <InfoBarItem
    label="clearInterval"
    navSelector="clearInterval History"
    panel={panels.clearInterval}
    count={msg.wrapperMetrics.callCounter.clearInterval}
  />

  <InfoBarItem
    label="RAF"
    tooltip="requestAnimationFrame"
    navSelector="requestAnimationFrame History"
    panel={panels.requestAnimationFrame}
    count={msg.wrapperMetrics.callCounter.requestAnimationFrame}
  />

  <InfoBarItem
    label="CAF"
    tooltip="cancelAnimationFrame"
    navSelector="cancelAnimationFrame History"
    panel={panels.cancelAnimationFrame}
    count={msg.wrapperMetrics.callCounter.cancelAnimationFrame}
  />

  <InfoBarItem
    label="RIC"
    tooltip="requestIdleCallback"
    navSelector="requestIdleCallback History"
    panel={panels.requestIdleCallback}
    count={msg.wrapperMetrics.callCounter.requestIdleCallback}
  />

  <InfoBarItem
    label="CIC"
    tooltip="cancelIdleCallback"
    navSelector="cancelIdleCallback History"
    panel={panels.cancelIdleCallback}
    count={msg.wrapperMetrics.callCounter.cancelIdleCallback}
  />

