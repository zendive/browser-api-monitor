<script lang="ts">
  import { type TMetrics } from '@/api-monitor-cs-main.ts';
  import Variable from './Variable.svelte';
  import {
    getSettings,
    onSettingsChange,
    panelsArrayToVisibilityMap,
    type TPanelVisibilityMap,
  } from '@/api/settings.ts';

  export let msg: TMetrics;

  let panels: TPanelVisibilityMap;

  getSettings().then((settings) => {
    panels = panelsArrayToVisibilityMap(settings.panels);

    onSettingsChange((newValue) => {
      panels = panelsArrayToVisibilityMap(newValue.panels);
    });
  });

  function scrollTo(e: MouseEvent, tableCaption: string) {
    e.preventDefault();
    const el = document.evaluate(
      `//caption[${tableCaption
        .split('|')
        .map((caption) => `contains(.,'${caption}')`)
        .join(' or ')}]`,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    if (el instanceof HTMLElement) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
  }
</script>

<div class="infobar">
  {#if msg}
    <div class="divider -anchor-left" />
    <a
      href="void(0)"
      class:panel-enabled={panels.eval && msg.callCounter.eval}
      on:click={(e) => scrollTo(e, 'Eval Usages')}
    >
      <strong>eval</strong>: <Variable bind:value={msg.callCounter.eval} />
    </a>
    <div class="divider" />
    <a
      href="void(0)"
      class:panel-enabled={panels.activeTimers &&
        msg.wrapperMetrics.onlineTimers}
      on:click={(e) => scrollTo(e, 'Active')}
    >
      <strong>Active Timers</strong>: <Variable
        bind:value={msg.wrapperMetrics.onlineTimers}
      />
    </a>
    <div class="divider" />
    <a
      href="void(0)"
      class:panel-enabled={panels.setTimeoutHistory &&
        msg.callCounter.setTimeout}
      on:click={(e) => scrollTo(e, 'setTimeout History')}
    >
      <strong>setTimeout</strong>: <Variable
        bind:value={msg.callCounter.setTimeout}
      />
    </a>
    <div class="divider" />
    <a
      href="void(0)"
      class:panel-enabled={panels.clearTimeoutHistory &&
        msg.callCounter.clearTimeout}
      on:click={(e) => scrollTo(e, 'clearTimeout History')}
    >
      <strong>clearTimeout</strong>: <Variable
        bind:value={msg.callCounter.clearTimeout}
      />
    </a>
    <div class="divider" />
    <a
      href="void(0)"
      class:panel-enabled={panels.setIntervalHistory &&
        msg.callCounter.setInterval}
      on:click={(e) => scrollTo(e, 'setInterval History')}
    >
      <strong>setInterval</strong>: <Variable
        bind:value={msg.callCounter.setInterval}
      />
    </a>
    <div class="divider" />
    <a
      href="void(0)"
      class:panel-enabled={panels.clearIntervalHistory &&
        msg.callCounter.clearInterval}
      on:click={(e) => scrollTo(e, 'clearInterval History')}
    >
      <strong>clearInterval</strong>: <Variable
        bind:value={msg.callCounter.clearInterval}
      />
    </a>
    <div class="divider" />
    <a
      href="void(0)"
      class:panel-enabled={panels.media && msg.mediaMetrics.total}
      on:click={(e) => scrollTo(e, 'Video|Audio')}
    >
      <strong>Media</strong>:
      <Variable bind:value={msg.mediaMetrics.total} />
    </a>
    <div class="divider" />
  {/if}
</div>

<style lang="scss">
  .infobar {
    display: flex;
    align-items: center;
    flex-grow: 1;
  }

  a {
    pointer-events: none;

    &.panel-enabled {
      pointer-events: all;
      color: var(--text);
    }
  }
</style>
