<script lang="ts">
  import { runtimeListen, portPost } from '@/api/communication';
  import { IS_DEV } from '@/api/const';
  import { Fps } from '@/api/time';
  import type { TMetrics } from '@/cs-main';
  import Variable from './components/Variable.svelte';
  import Timers from './components/Timers.svelte';
  import Media from './components/Media.svelte';
  import EvalMetrics from './components/EvalMetrics.svelte';
  import Version from './components/Version.svelte';
  import { onMount } from 'svelte';
  import TogglePanels from './components/TogglePanels.svelte';

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

    <div class="infobar">
      {#if msg}
        <div class="divider -anchor-left" />
        <div>
          <strong>eval</strong>: <Variable bind:value={msg.callCounter.eval} />
        </div>
        <div class="divider" />
        <div>
          <strong>setTimeout</strong>: <Variable
            bind:value={msg.callCounter.setTimeout}
          />
        </div>
        <div class="divider" />
        <div>
          <strong>clearTimeout</strong>: <Variable
            bind:value={msg.callCounter.clearTimeout}
          />
        </div>
        <div class="divider" />
        <div>
          <strong>setInterval</strong>: <Variable
            bind:value={msg.callCounter.setInterval}
          />
        </div>
        <div class="divider" />
        <div>
          <strong>clearInterval</strong>: <Variable
            bind:value={msg.callCounter.clearInterval}
          />
        </div>
        <div class="divider" />
        <div>
          <strong>Media</strong>:
          <Variable bind:value={msg.mediaMetrics.total} />
        </div>
        <div class="divider" />
      {/if}
    </div>

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
    --header-height: 20px;
    display: flex;
    flex-direction: column;
    height: 100%;

    .divider {
      width: 1px;
      height: var(--header-height);
      background-color: var(--border);
      margin: 0 0.4rem;

      &.-anchor-left {
        background-color: transparent;
        margin-left: 0;
      }
      &.-anchor-right {
        background-color: transparent;
        margin-right: 0;
      }
    }

    header {
      display: flex;
      align-items: center;
      height: var(--header-height);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);

      .infobar {
        display: flex;
        align-items: center;
        flex-grow: 1;
      }
    }
    main {
      overflow-y: scroll;
      flex-grow: 1;
    }
  }
</style>
