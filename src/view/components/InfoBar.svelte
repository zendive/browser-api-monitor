<script lang="ts">
  import type { TMetrics } from '@/api-monitor-cs-main.ts';
  import {
    getSettings,
    onSettingsChange,
    panelsArrayToVisibilityMap,
    type TPanelVisibilityMap,
  } from '@/api/settings.ts';
  import InfoBarItem from '@/view/components/InfoBarItem.svelte';

  export let msg: TMetrics;

  let panels: TPanelVisibilityMap;

  getSettings().then((settings) => {
    panels = panelsArrayToVisibilityMap(settings.panels);

    onSettingsChange((newValue) => {
      panels = panelsArrayToVisibilityMap(newValue.panels);
    });
  });
</script>

<div class="infobar">
  {#if msg}
    <InfoBarItem
      label="eval"
      navSelector="Eval History"
      bind:panel={panels.eval}
      bind:count={msg.wrapperMetrics.callCounter.eval}
    />

    <InfoBarItem
      label="Media"
      navSelector="Videos|Audios"
      bind:panel={panels.media}
      bind:count={msg.mediaMetrics.total}
    />

    <InfoBarItem
      label="Active Timers"
      navSelector="Active"
      bind:panel={panels.activeTimers}
      bind:count={msg.wrapperMetrics.callCounter.activeTimers}
    />

    <InfoBarItem
      label="setTimeout"
      navSelector="setTimeout History"
      bind:panel={panels.setTimeout}
      bind:count={msg.wrapperMetrics.callCounter.setTimeout}
    />

    <InfoBarItem
      label="clearTimeout"
      navSelector="clearTimeout History"
      bind:panel={panels.clearTimeout}
      bind:count={msg.wrapperMetrics.callCounter.clearTimeout}
    />

    <InfoBarItem
      label="setInterval"
      navSelector="setInterval History"
      bind:panel={panels.setInterval}
      bind:count={msg.wrapperMetrics.callCounter.setInterval}
    />

    <InfoBarItem
      label="clearInterval"
      navSelector="clearInterval History"
      bind:panel={panels.clearInterval}
      bind:count={msg.wrapperMetrics.callCounter.clearInterval}
    />

    <InfoBarItem
      label="RAF"
      tooltip="requestAnimationFrame"
      navSelector="requestAnimationFrame History"
      bind:panel={panels.requestAnimationFrame}
      bind:count={msg.wrapperMetrics.callCounter.requestAnimationFrame}
    />

    <InfoBarItem
      label="CAF"
      tooltip="cancelAnimationFrame"
      navSelector="cancelAnimationFrame History"
      bind:panel={panels.cancelAnimationFrame}
      bind:count={msg.wrapperMetrics.callCounter.cancelAnimationFrame}
    />

    <InfoBarItem
      label="RIC"
      tooltip="requestIdleCallback"
      navSelector="requestIdleCallback History"
      bind:panel={panels.requestIdleCallback}
      bind:count={msg.wrapperMetrics.callCounter.requestIdleCallback}
    />

    <InfoBarItem
      label="CIC"
      tooltip="cancelIdleCallback"
      navSelector="cancelIdleCallback History"
      bind:panel={panels.cancelIdleCallback}
      bind:count={msg.wrapperMetrics.callCounter.cancelIdleCallback}
    />
  {/if}
</div>

<style lang="scss">
  .infobar {
    display: flex;
    flex-wrap: wrap;
    flex-grow: 1;
    align-items: center;
  }
</style>
