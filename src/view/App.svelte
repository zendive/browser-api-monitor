<script lang="ts">
  import { runtimeListen, portPost } from '@/api/communication';
  import { IS_DEV } from '@/api/const';
  import { Fps } from '@/api/time';
  import type { TMetrics } from '@/cs-main';
  import Variable from './components/Variable.svelte';
  import Timers from './components/Timers.svelte';
  import Media from './components/Media.svelte';
  import EvalMetrics from './components/EvalMetrics.svelte';
  import { onMount } from 'svelte';

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
</script>

<section class="root">
  <header>
    {#if IS_DEV}
      <button on:click={() => location.reload()} title="Reload">
        <span class="icon -refresh" />
      </button>
    {/if}
    <button on:click={onTogglePause} title="Toggle pause">
      {#if paused}<span class="icon -play" />{:else}<span
          class="icon -pause"
        />{/if}
    </button>
    <button on:click={onResetHistory} title="Reset history">
      <span class="icon -clear" />
    </button>

    {#if msg}
      <div class="infobar">
        <div class="divider" />
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
      </div>
    {/if}

    {#if msg && !paused}
      <div class="divider" />
      <div>
        {#if msg.tickTook}{msg.tickTook} /{/if}
        <Variable bind:value={fpsValue} /> fps
      </div>
    {/if}
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
    }
  }
</style>
