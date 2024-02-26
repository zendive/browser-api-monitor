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
  import Number from './components/Number.svelte';
  import VideoMetrics from './components/VideoMetrics.svelte';
  import Timers from './components/Timers.svelte';

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
      <span><Number bind:value={fpsValue} />fps [{m.tickTook}]</span>
    </div>

    {#if m.dangerEval.invocations}
      <div>
        <strong>eval:</strong>
        <Number bind:value={m.dangerEval.invocations} />
      </div>
    {/if}

    {#if m.videos.length}
      <div>Videos: <Number bind:value={m.videos.length} /></div>
      {#each m.videos as videoMetrics}
        <VideoMetrics bind:metrics={videoMetrics} />
      {/each}
    {/if}
    {#if m.audiosCount}
      <div>Audios: <Number bind:value={m.audiosCount} /></div>
    {/if}

    <Timers bind:timers={m.timers} bind:timersUsages={m.timersUsages} />
  </main>
{/if}

<style>
  main {
    padding: 1rem;
  }
</style>
