<script lang="ts">
  import type { TTelemetry } from '../../wrapper/Wrapper.ts';
  import {
    DEFAULT_PANELS,
    getSettings,
    onSettingsChange,
    panelsArray2Map,
    type TPanelMap,
  } from '../../api/settings.ts';
  import InfoBarItem from './InfoBarItem.svelte';

  let {
    mediaTotal,
    activeTimers,
    callCounter,
  }: {
    mediaTotal: number;
    activeTimers: number;
    callCounter: TTelemetry['callCounter'];
  } = $props();

  let panels: TPanelMap = $state.raw(panelsArray2Map(DEFAULT_PANELS));

  getSettings().then((settings) => {
    panels = panelsArray2Map(settings.panels);

    onSettingsChange((newValue) => {
      panels = panelsArray2Map(newValue.panels);
    });
  });
</script>

<InfoBarItem
  label="eval"
  navSelector="Eval History"
  panel={panels.eval}
  count={callCounter.eval}
/>

<InfoBarItem
  label="Media"
  navSelector="Videos|Audios"
  panel={panels.media}
  count={mediaTotal}
/>

<InfoBarItem
  label="Active Timers"
  navSelector="Active"
  panel={panels.activeTimers}
  count={activeTimers}
/>

<InfoBarItem
  label="setTimeout"
  navSelector="setTimeout History"
  panel={panels.setTimeout}
  count={callCounter.setTimeout}
/>

<InfoBarItem
  label="clearTimeout"
  navSelector="clearTimeout History"
  panel={panels.clearTimeout}
  count={callCounter.clearTimeout}
/>

<InfoBarItem
  label="setInterval"
  navSelector="setInterval History"
  panel={panels.setInterval}
  count={callCounter.setInterval}
/>

<InfoBarItem
  label="clearInterval"
  navSelector="clearInterval History"
  panel={panels.clearInterval}
  count={callCounter.clearInterval}
/>

<InfoBarItem
  label="RAF"
  tooltip="requestAnimationFrame"
  navSelector="requestAnimationFrame History"
  panel={panels.requestAnimationFrame}
  count={callCounter.requestAnimationFrame}
/>

<InfoBarItem
  label="CAF"
  tooltip="cancelAnimationFrame"
  navSelector="cancelAnimationFrame History"
  panel={panels.cancelAnimationFrame}
  count={callCounter.cancelAnimationFrame}
/>

<InfoBarItem
  label="RIC"
  tooltip="requestIdleCallback"
  navSelector="requestIdleCallback History"
  panel={panels.requestIdleCallback}
  count={callCounter.requestIdleCallback}
/>

<InfoBarItem
  label="CIC"
  tooltip="cancelIdleCallback"
  navSelector="cancelIdleCallback History"
  panel={panels.cancelIdleCallback}
  count={callCounter.cancelIdleCallback}
/>
