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
  import type { TMetrics } from '@/cs-main';
  import VideoMetrics from './components/VideoMetrics.svelte';

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

    {#each m.timers as api}
      <div>
        {#if api.invocations}
          <strong>{api.name}:</strong>
          <Number bind:value={api.invocations} />
          {#if api.name === 'setTimeout'}
            [<Number bind:value={m.timersUsages.timeouts.length} />]
            {#each m.timersUsages.timeouts as v}
              <li>
                {v[0]}, [{#each v[1] as stack, index}
                  {#if index > 0}|{/if}<a href={stack.link}>{stack.name}</a
                  >{/each}]
              </li>
            {/each}
          {/if}
          {#if api.name === 'setInterval'}
            [<Number bind:value={m.timersUsages.intervals.length} />]
            {#each m.timersUsages.intervals as v}
              <li>
                {v[0]}, [{#each v[1] as stack, index}
                  {#if index > 0}|{/if}<a href={stack.link}>{stack.name}</a
                  >{/each}]
              </li>
            {/each}
          {/if}
        {/if}
      </div>
    {/each}
  </main>
{/if}

<style>
  main {
    padding: 1rem;
  }
</style>
