<script lang="ts">
  import { runtimeListen, portPost } from '../api/communication.ts';
  import { IS_DEV } from '../api/env.ts';
  import { MAX_TRAFFIC_DURATION_BEFORE_AUTOPAUSE } from '../api/const.ts';
  import { getSettings, setSettings } from '../api/settings.ts';
  import type { TMetrics } from '../api-monitor-cs-main.ts';
  import TimersMetrics from './components/TimersMetrics.svelte';
  import Media from './components/Media.svelte';
  import EvalMetrics from './components/EvalMetrics.svelte';
  import AnimationMetrics from './components/AnimationMetrics.svelte';
  import Version from './components/Version.svelte';
  import { onMount } from 'svelte';
  import TogglePanels from './components/TogglePanels.svelte';
  import InfoBar from './components/InfoBar.svelte';
  import TickSpinner from './components/TickSpinner.svelte';
  import IdleCallbackMetrics from './components/IdleCallbackMetrics.svelte';
  import Alert from './components/Alert.svelte';

  let spinnerEl: TickSpinner | null = $state.raw(null);
  let autopauseAlertEl: Alert | null = $state.raw(null);
  let paused = $state(false);
  let msg: TMetrics | null = $state.raw(null);

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
        if (!paused) {
          onTogglePause();
          autopauseAlertEl?.show();
        }
      } else {
        portPost({
          msg: 'telemetry-acknowledged',
          trafficDuration,
          timeSent: now,
        });
      }

      spinnerEl?.tick();
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
  <Alert bind:this={autopauseAlertEl} dismissable={true} title="Autopaused"
    >Communication with the inspected window experienced a long delay and was
    autopaused.<br />Try hiding panels you don't need at the moment to minimise
    quantity of monitored data.</Alert
  >

  <header>
    {#if IS_DEV}
      <button onclick={onDevReload} title="Reload" aria-label="Reload">
        <span class="icon -refresh"></span>
      </button>
      <div class="divider -thin"></div>
    {/if}
    <TogglePanels />
    <div class="divider -thin"></div>
    <button onclick={onTogglePause} title="Toggle pause">
      {#if paused}
        <span class="icon -play"></span>
      {:else}
        <span class="icon -pause"></span>
      {/if}
    </button>
    <div class="divider -thin"></div>
    <button
      onclick={onResetHistory}
      title="Reset history"
      aria-label="Reset history"
    >
      <span class="icon -clear"></span>
    </button>
    <div class="divider -thin"></div>

    <div class="infobar">
      {#if msg}
        <InfoBar {msg} />
      {/if}
    </div>

    {#if !paused}
      <div class="divider"></div>
      <TickSpinner bind:this={spinnerEl} />
    {/if}

    <div class="divider"></div>
    <Version />
    <div class="divider -anchor-right"></div>
  </header>

  <main>
    {#if msg}
      {#if msg.wrapperMetrics.evalHistory?.length}
        <EvalMetrics metrics={msg.wrapperMetrics.evalHistory} />
      {/if}
      <Media metrics={msg.mediaMetrics} />
      <TimersMetrics metrics={msg.wrapperMetrics} />
      <AnimationMetrics metrics={msg.wrapperMetrics} />
      <IdleCallbackMetrics metrics={msg.wrapperMetrics} />
    {/if}
  </main>
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

      .infobar {
        display: flex;
        flex-wrap: wrap;
        flex-grow: 1;
        align-items: center;
      }
    }
    main {
      overflow-y: scroll;
      flex-grow: 1;
    }
  }
</style>
