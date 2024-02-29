<script lang="ts">
  import {
    runtimeListen,
    portPost,
    EVENT_METRICS,
    EVENT_SETUP,
    EVENT_PANEL_HIDDEN,
    EVENT_PANEL_SHOWN,
    EVENT_CONTENT_SCRIPT_LOADED,
  } from '@/api/communication';
  import { IS_DEV } from '@/api/const';
  import { Fps } from '@/api/time';
  import type { TMetrics } from '@/cs-main';
  import Variable from './components/Variable.svelte';
  import Timers from './components/Timers.svelte';
  import Videos from './components/Videos.svelte';

  let fpsValue = 0;
  const fps = new Fps((value) => (fpsValue = value)).start();
  let paused = false;
  let m: TMetrics;

  runtimeListen(EVENT_CONTENT_SCRIPT_LOADED, () => {
    paused = false;
    portPost(EVENT_PANEL_SHOWN);
  });
  portPost(EVENT_SETUP, {});
  runtimeListen(EVENT_METRICS, (metrics: TMetrics) => {
    m = metrics;
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
</script>

{#if m}
  <main>
    <div>
      {#if IS_DEV}<button on:click={() => location.reload()} title="Reload"
          >♻️</button
        >{/if}
      <button on:click={onTogglePause} title="Toggle pause"
        >{#if paused}🔴{:else}🟢{/if}</button
      >
      <span><Variable bind:value={fpsValue} />fps [{m.tickTook}]</span>
    </div>

    {#if m.dangerEval.invocations}
      <div>
        <strong>eval:</strong>
        <Variable bind:value={m.dangerEval.invocations} />
      </div>
    {/if}

    {#if m.videos.length}
      <div>Videos: <Variable bind:value={m.videos.length} /></div>
      <Videos bind:metrics={m.videos} />
    {/if}
    {#if m.audiosCount}
      <div>Audios: <Variable bind:value={m.audiosCount} /></div>
    {/if}

    <Timers
      bind:invocations={m.timersInvocations}
      bind:usages={m.timersUsages}
    />
  </main>
{/if}

<style>
  main {
    padding: 1rem;
  }
</style>
