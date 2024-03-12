<script lang="ts">
  import {
    runtimeListen,
    portPost,
    EVENT_TELEMETRY,
    EVENT_CS_COMMAND,
    EVENT_PANEL_HIDDEN,
    EVENT_PANEL_SHOWN,
    EVENT_CONTENT_SCRIPT_LOADED,
    type TCsResetHistory,
  } from '@/api/communication';
  import { IS_DEV } from '@/api/const';
  import { Fps } from '@/api/time';
  import type { TMetrics } from '@/cs-main';
  import Variable from './components/Variable.svelte';
  import Timers from './components/Timers.svelte';
  import Media from './components/Media.svelte';
  import EvalMetrics from './components/EvalMetrics.svelte';

  let fpsValue = 0;
  const fps = new Fps((value) => (fpsValue = value)).start();
  let paused = false;
  let msg: TMetrics;

  runtimeListen(EVENT_CONTENT_SCRIPT_LOADED, () => {
    paused = false;
    portPost(EVENT_PANEL_SHOWN);
  });
  runtimeListen(EVENT_TELEMETRY, (metrics: TMetrics) => {
    msg = metrics;
    fps.tick();
  });

  function onTogglePause() {
    paused = !paused;
    if (paused) {
      portPost(EVENT_PANEL_HIDDEN);
    } else {
      portPost(EVENT_PANEL_SHOWN);
    }
  }

  function onResetHistory() {
    portPost(EVENT_CS_COMMAND, <TCsResetHistory>{
      operator: 'reset-wrapper-history',
    });
  }
</script>

{#if msg}
  <main>
    <div>
      {#if IS_DEV}
        <button on:click={() => location.reload()} title="Reload">
          <span class="icon -refresh"></span>
        </button>
      {/if}
      <button on:click={onTogglePause} title="Toggle pause">
        {#if paused}🔴{:else}🟢{/if}
      </button>
      <button on:click={onResetHistory} title="Reset history">
        <span class="icon -clear"></span>
      </button>
      {#if !paused}
        <span><Variable bind:value={fpsValue} />fps [{msg.tickTook}]</span>
      {/if}
    </div>

    <div>
      <span
        ><strong>eval</strong>:<Variable
          bind:value={msg.callCounter.eval}
        /></span
      >
      <span
        ><strong>setTimeout</strong>: <Variable
          bind:value={msg.callCounter.setTimeout}
        /></span
      >
      <span
        ><strong>clearTimeout</strong>: <Variable
          bind:value={msg.callCounter.clearTimeout}
        /></span
      >
      <span
        ><strong>setInterval</strong>: <Variable
          bind:value={msg.callCounter.setInterval}
        /></span
      >
      <span
        ><strong>clearInterval</strong>: <Variable
          bind:value={msg.callCounter.clearInterval}
        /></span
      >
    </div>

    <EvalMetrics
      bind:callCount={msg.callCounter.eval}
      bind:metrics={msg.wrapperMetrics.evalHistory}
    />

    <Media bind:metrics={msg.mediaMetrics} />

    <Timers bind:metrics={msg.wrapperMetrics} />
  </main>
{/if}

<style>
  main {
    padding: 1rem;
  }
</style>
