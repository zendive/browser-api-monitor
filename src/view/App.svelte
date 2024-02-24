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
  import Number from './components/Number.svelte';

  let fpsValue = 0;
  const fps = new Fps((value) => (fpsValue = value)).start();
  let tickTook = '';
  let videosCount = 0;
  let audiosCount = 0;
  let timers: any[] = []; // TODO: fix `any`
  let timersUsages: { timeouts: []; intervals: [] };
  let dangerEval: any = {};
  let paused = false;

  runtimeListen(EVENT_CONTENT_SCRIPT_LOADED, () => {
    paused = false;
    portPost(EVENT_PANEL_SHOWN);
  });
  portPost(EVENT_SETUP, {});
  runtimeListen(EVENT_METRICS, (o) => {
    videosCount = o.videosCount;
    audiosCount = o.audiosCount;
    timers = o.timers;
    timersUsages = o.timersUsages;
    dangerEval = o.dangerEval;
    tickTook = o.tickTook;
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

<main>
  <div>
    {#if IS_DEV}<button on:click={() => location.reload()} title="Reload"
        >♻️</button
      >{/if}
    <button on:click={onTogglePause} title="Toggle pause"
      >{#if paused}🔴{:else}🟢{/if}</button
    >
    <span><Number bind:value={fpsValue} />fps [{tickTook}]</span>
  </div>

  {#if dangerEval.invocations}
    <div>
      <strong>eval:</strong>
      <Number bind:value={dangerEval.invocations} />
    </div>
  {/if}

  {#if videosCount}
    <div>Videos: <Number bind:value={videosCount} /></div>
  {/if}
  {#if audiosCount}
    <div>Audios: <Number bind:value={audiosCount} /></div>
  {/if}

  {#each timers as api}
    <div>
      {#if api.invocations}
        <strong>{api.name}:</strong>
        <Number bind:value={api.invocations} />
        {#if api.name === 'setTimeout'}
          [<Number bind:value={timersUsages.timeouts.length} />]
          {#each timersUsages.timeouts as v}
            <li>{v[0]}, {v[1]}</li>
          {/each}
        {/if}
        {#if api.name === 'setInterval'}
          [<Number bind:value={timersUsages.intervals.length} />]
          {#each timersUsages.intervals as v}
            <li>{v[0]}, {v[1]}</li>
          {/each}
        {/if}
      {/if}
    </div>
  {/each}
</main>

<style>
  main {
    padding: 1rem;
  }
</style>
