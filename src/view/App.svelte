<script lang="ts">
  import { runtimeListen, portPost } from '@/api/communication.ts';
  import { IS_DEV } from '@/api/env.ts';
  import type { TMetrics } from '@/api-monitor-cs-main.ts';
  import Timers from '@/view/components/Timers.svelte';
  import Media from '@/view/components/Media.svelte';
  import EvalMetrics from '@/view/components/EvalMetrics.svelte';
  import AnimationMetrics from '@/view/components/AnimationMetrics.svelte';
  import Version from '@/view/components/Version.svelte';
  import { onMount } from 'svelte';
  import TogglePanels from '@/view/components/TogglePanels.svelte';
  import InfoBar from '@/view/components/InfoBar.svelte';
  import { getSettings, setSettings } from '@/api/settings.ts';
  import TickSpinner from '@/view/components/TickSpinner.svelte';
  import { MAX_TRAFFIC_DURATION_BEFORE_AUTOPAUSE } from '@/api/const.ts';

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
      <button on:click={onDevReload} title="Reload">
        <span class="icon -refresh" />
      </button>
    {/if}
    <TogglePanels />
    <button on:click={onTogglePause} title="Toggle pause">
      {#if paused}<span class="icon -play" />{:else}<span
          class="icon -pause"
        />{/if}
    </button>
    <button on:click={onResetHistory} title="Reset history">
      <span class="icon -clear" />
    </button>

    <InfoBar bind:msg />

    {#if msg && !paused}
      <div class="divider" />
      <TickSpinner bind:this={spinner} />
    {/if}

    <div class="divider" />
    <Version />
    <div class="divider -anchor-right" />
  </header>

  {#if msg}
    <main>
      {#if msg.wrapperMetrics.evalHistory?.length}
        <EvalMetrics bind:metrics={msg.wrapperMetrics.evalHistory} />
      {/if}
      <Media bind:metrics={msg.mediaMetrics} />
      <Timers bind:metrics={msg.wrapperMetrics} />
      <AnimationMetrics bind:metrics={msg.wrapperMetrics} />
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
    }
    main {
      overflow-y: scroll;
      flex-grow: 1;
    }
  }
</style>
