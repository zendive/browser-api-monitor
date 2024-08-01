<script lang="ts">
  import type { TMetrics } from '@/api-monitor-cs-main.ts';
  import Variable from '@/view/components/Variable.svelte';
  import {
    getSettings,
    onSettingsChange,
    panelsArrayToVisibilityMap,
    type TPanelVisibilityMap,
  } from '@/api/settings.ts';

  export let msg: TMetrics;

  let panels: TPanelVisibilityMap;
  $: onlineTimersSize = msg?.wrapperMetrics.onlineTimers?.length ?? 0;

  getSettings().then((settings) => {
    panels = panelsArrayToVisibilityMap(settings.panels);

    onSettingsChange((newValue) => {
      panels = panelsArrayToVisibilityMap(newValue.panels);
    });
  });

  function scrollTo(tableCaption: string) {
    const condition = tableCaption
      .split('|')
      .map((caption) => `contains(@data-navigation-tag,'${caption}')`)
      .join(' or ');
    const el = document.evaluate(
      `//node()[${condition}]`,
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
    <a
      href="void(0)"
      class:panel-enabled={panels.eval && msg.wrapperMetrics.callCounter.eval}
      on:click|preventDefault={() => void scrollTo('Eval History')}
    >
      <strong>eval</strong>: <Variable
        bind:value={msg.wrapperMetrics.callCounter.eval}
      />
    </a>

    <a
      href="void(0)"
      class:panel-enabled={panels.media && msg.mediaMetrics.total}
      on:click|preventDefault={() => void scrollTo('Videos|Audios')}
    >
      <strong>Media</strong>:
      <Variable bind:value={msg.mediaMetrics.total} />
    </a>

    <a
      href="void(0)"
      class:panel-enabled={panels.activeTimers && onlineTimersSize}
      on:click|preventDefault={() => void scrollTo('Active')}
    >
      <strong>Active Timers</strong>: <Variable bind:value={onlineTimersSize} />
    </a>

    <a
      href="void(0)"
      class:panel-enabled={panels.setTimeout &&
        msg.wrapperMetrics.callCounter.setTimeout}
      on:click|preventDefault={() => void scrollTo('setTimeout History')}
    >
      <strong>setTimeout</strong>: <Variable
        bind:value={msg.wrapperMetrics.callCounter.setTimeout}
      />
    </a>

    <a
      href="void(0)"
      class:panel-enabled={panels.clearTimeout &&
        msg.wrapperMetrics.callCounter.clearTimeout}
      on:click|preventDefault={() => void scrollTo('clearTimeout History')}
    >
      <strong>clearTimeout</strong>: <Variable
        bind:value={msg.wrapperMetrics.callCounter.clearTimeout}
      />
    </a>

    <a
      href="void(0)"
      class:panel-enabled={panels.setInterval &&
        msg.wrapperMetrics.callCounter.setInterval}
      on:click|preventDefault={() => void scrollTo('setInterval History')}
    >
      <strong>setInterval</strong>: <Variable
        bind:value={msg.wrapperMetrics.callCounter.setInterval}
      />
    </a>

    <a
      href="void(0)"
      class:panel-enabled={panels.clearInterval &&
        msg.wrapperMetrics.callCounter.clearInterval}
      on:click|preventDefault={() => void scrollTo('clearInterval History')}
    >
      <strong>clearInterval</strong>: <Variable
        bind:value={msg.wrapperMetrics.callCounter.clearInterval}
      />
    </a>

    <a
      href="void(0)"
      class:panel-enabled={panels.requestAnimationFrame &&
        msg.wrapperMetrics.callCounter.requestAnimationFrame}
      on:click|preventDefault={() =>
        void scrollTo('requestAnimationFrame History')}
    >
      <strong title="requestAnimationFrame">RAF</strong>:
      {msg.wrapperMetrics.callCounter.requestAnimationFrame}
    </a>

    <a
      href="void(0)"
      class:panel-enabled={panels.cancelAnimationFrame &&
        msg.wrapperMetrics.callCounter.cancelAnimationFrame}
      on:click|preventDefault={() =>
        void scrollTo('cancelAnimationFrame History')}
    >
      <strong title="cancelAnimationFrame">CAF</strong>:
      {msg.wrapperMetrics.callCounter.cancelAnimationFrame}
    </a>

    <a
      href="void(0)"
      class:panel-enabled={panels.requestIdleCallback &&
        msg.wrapperMetrics.callCounter.requestIdleCallback}
      on:click|preventDefault={() =>
        void scrollTo('requestIdleCallback History')}
    >
      <strong title="requestIdleCallback">RIC</strong>:
      {msg.wrapperMetrics.callCounter.requestIdleCallback}
    </a>

    <a
      href="void(0)"
      class:panel-enabled={panels.cancelIdleCallback &&
        msg.wrapperMetrics.callCounter.cancelIdleCallback}
      on:click|preventDefault={() =>
        void scrollTo('cancelIdleCallback History')}
    >
      <strong title="cancelIdleCallback">CIC</strong>:
      {msg.wrapperMetrics.callCounter.cancelIdleCallback}
    </a>
  {/if}
</div>

<style lang="scss">
  .infobar {
    display: flex;
    flex-wrap: wrap;
    flex-grow: 1;
    align-items: center;
  }

  a {
    pointer-events: none;
    padding: 0 0.4rem;
    border-right: 1px solid var(--border);

    &.panel-enabled {
      pointer-events: all;
      color: var(--text);
    }
  }
</style>
