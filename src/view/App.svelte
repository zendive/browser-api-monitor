<script lang="ts">
  import {
    runtimeListen,
    portPost,
    EVENT_METRICS,
    EVENT_SETUP,
  } from '@/api/communication';
  import Number from './components/Number.svelte';
  import { IS_DEV } from '@/api/const';
  import { setupTimekit } from '@/api/time';

  const timekit = setupTimekit();
  let fpsValue = 0;
  const fps = new timekit.Fps((value) => (fpsValue = value)).start();
  let tickTook = '';
  let videosCount = 0;
  let audiosCount = 0;
  let timers: any[] = []; // TODO: fix `any`
  let timersUsages: (number | boolean)[][] = [];
  let dangerEval: any = {};

  $: timeoutUsagesStr = `[${timersUsages
    .filter((v: (number | boolean)[]) => !v[0])
    .map((v: any) => v[1])
    .sort((a, b) => b - a) // descending
    .join(', ')}]`;
  $: intervalUsagesStr = `[${timersUsages
    .filter((v: (number | boolean)[]) => v[0])
    .map((v: (number | boolean)[]) => v[1])
    .sort((a, b) => b - a) // descending
    .join(', ')}]`;

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
</script>

<main>
  {#if IS_DEV}<button on:click={() => location.reload()}>♻️</button>{/if}

  <div><Number bind:value={fpsValue} />fps [{tickTook}]</div>

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
          {timeoutUsagesStr}
        {/if}
        {#if api.name === 'setInterval'}
          {intervalUsagesStr}
        {/if}
      {/if}
    </div>
  {/each}

  {#if dangerEval.invocations}
    <div>
      <strong>eval:</strong>
      <Number bind:value={dangerEval.invocations} />
    </div>
  {/if}
</main>

<style>
  main {
    padding: 1rem;
  }
</style>
