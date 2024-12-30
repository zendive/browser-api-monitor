<script lang="ts">
  import { runtimeListen, portPost } from '../api/communication.ts';
  import { IS_DEV } from '../api/env.ts';
  import { MAX_TRAFFIC_DURATION_BEFORE_AUTOPAUSE } from '../api/const.ts';
  import { getSettings, setSettings } from '../api/settings.ts';
  import type { TMetrics } from '../api-monitor-cs-main.ts';
  import Timers from './components/Timers.svelte';
  import Media from './components/Media.svelte';
  import EvalMetrics from './components/EvalMetrics.svelte';
  import AnimationMetrics from './components/AnimationMetrics.svelte';
  import Version from './components/Version.svelte';
  import { onMount } from 'svelte';
  import TogglePanels from './components/TogglePanels.svelte';
  import InfoBar from './components/InfoBar.svelte';
  import TickSpinner from './components/TickSpinner.svelte';
  import IdleCallbackMetrics from './components/IdleCallbackMetrics.svelte';

  let spinner: TickSpinner | null = null;
  let paused = false;
  let msg: TMetrics;

  runtimeListen(async (o) => {
    if (o.msg === 'content-script-loaded') {
      const settings = await getSettings();

      if (settings.devtoolsPanelShown && !settings.paused) {
        portPost({ msg: 'start-observe' });
      }
    } else if (o.msg === 'telemetry') {
      msg = o.metrics;

      const now = Date.now();
      const trafficDuration = now - o.metrics.collectingStartTime;

      if (trafficDuration > MAX_TRAFFIC_DURATION_BEFORE_AUTOPAUSE) {
        !paused && onTogglePause();
      } else {
        portPost({
          msg: 'telemetry-acknowledged',
          trafficDuration,
          timeSent: now,
        });
      }

      spinner?.tick();
    }
  });

  onMount(() => {
    getSettings().then((settings) => {
      paused = settings.paused;
    });

    window.addEventListener('beforeunload', () => {
      portPost({ msg: 'stop-observe' });
    });
  });

  function onTogglePause() {
    paused = !paused;
    setSettings({ paused });

    if (paused) {
      portPost({ msg: 'stop-observe' });
    } else {
      portPost({ msg: 'start-observe' });
    }
  }

  function onResetHistory() {
    portPost({ msg: 'reset-wrapper-history' });
  }

  function onDevReload() {
    console.clear();
    chrome.storage.local.clear();
    location.reload();
  }
</script>

<section class="root">
  <header>
    {#if IS_DEV}
      <button on:click={onDevReload} title="Reload" aria-label="Reload">
        <span class="icon -refresh"></span>
      </button>
      <div class="divider -thin"></div>
    {/if}
    <TogglePanels />
    <div class="divider -thin"></div>
    <button on:click={onTogglePause} title="Toggle pause">
      {#if paused}
        <span class="icon -play"></span>
      {:else}
        <span class="icon -pause"></span>
      {/if}
    </button>
    <div class="divider -thin"></div>
    <button
      on:click={onResetHistory}
      title="Reset history"
      aria-label="Reset history"
    >
      <span class="icon -clear"></span>
    </button>
    <div class="divider -thin"></div>

    <InfoBar bind:msg />

    {#if msg && !paused}
      <div class="divider"></div>
      <TickSpinner bind:this={spinner} />
    {/if}

    <div class="divider"></div>
    <Version />
    <div class="divider -anchor-right"></div>
  </header>

  {#if msg}
    <main>
      {#if msg.wrapperMetrics.evalHistory?.length}
        <EvalMetrics bind:metrics={msg.wrapperMetrics.evalHistory} />
      {/if}
      <Media bind:metrics={msg.mediaMetrics} />
      <Timers bind:metrics={msg.wrapperMetrics} />
      <AnimationMetrics bind:metrics={msg.wrapperMetrics} />
      <IdleCallbackMetrics bind:metrics={msg.wrapperMetrics} />
    </main>
  {/if}
</section>

<style lang="scss">
  .root {
    display: flex;
    flex-direction: column;
    height: 100%;

    header {
      display: flex;
      align-items: center;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      user-select: none;
      // min-height: 1.4374rem;
    }
    main {
      overflow-y: scroll;
      flex-grow: 1;
    }
  }
</style>
