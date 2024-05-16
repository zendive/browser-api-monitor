<script lang="ts">
  import { runtimeListen, portPost } from '@/api/communication.ts';
  import { IS_DEV } from '@/api/env.ts';
  import { Fps } from '@/api/time.ts';
  import type { TMetrics } from '@/api-monitor-cs-main.ts';
  import Timers from '@/view/components/Timers.svelte';
  import Media from '@/view/components/Media.svelte';
  import EvalMetrics from '@/view/components/EvalMetrics.svelte';
  import Version from '@/view/components/Version.svelte';
  import { onMount } from 'svelte';
  import TogglePanels from '@/view/components/TogglePanels.svelte';
  import InfoBar from '@/view/components/InfoBar.svelte';

  let fpsValue = 0;
  const fps = new Fps((value) => (fpsValue = value)).start();
  let paused = false;
  let msg: TMetrics;

  runtimeListen((o) => {
    if (o.msg === 'content-script-loaded' && !paused) {
      portPost({ msg: 'start-observe' });
    } else if (o.msg === 'telemetry') {
      msg = o.metrics;
      fps.tick();
    }
  });

  onMount(() => {
    portPost({ msg: 'start-observe' });
    window.addEventListener('beforeunload', () => {
      portPost({ msg: 'stop-observe' });
    });
  });

  function onTogglePause() {
    paused = !paused;
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
      <div>
        {#if msg.tickTook}
          <span title="Time took to collect telemetry data for a single update">
            {msg.tickTook}
          </span> /
        {/if}
        <span title="Telemetry updates per second">
          {fpsValue} fps
        </span>
      </div>
    {/if}

    <div class="divider" />
    <Version />
    <div class="divider -anchor-right" />
  </header>

  {#if msg}
    <main>
      <EvalMetrics
        bind:callCount={msg.callCounter.eval}
        bind:metrics={msg.wrapperMetrics.evalHistory}
      />

      <Media bind:metrics={msg.mediaMetrics} />

      <Timers bind:metrics={msg.wrapperMetrics} />
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
      height: var(--header-height);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    main {
      overflow-y: scroll;
      flex-grow: 1;
    }
  }
</style>
