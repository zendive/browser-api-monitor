<script lang="ts">
  import { EMsg, portPost, runtimeListen } from '../api/communication.ts';
  import { getSettings, setSettings } from '../api/settings.ts';
  import diff from '../api/diff.ts';
  import type { TTelemetry } from '../wrapper/Wrapper.ts';
  import { onMount } from 'svelte';
  import Media from './panel/Media.svelte';
  import Eval from './panel/Eval.svelte';
  import Version from './menu/Version.svelte';
  import TogglePanels from './menu/TogglePanels.svelte';
  import InfoBar from './menu/InfoBar.svelte';
  import TickSpinner from './menu/TickSpinner.svelte';
  import OnlineTimers from './panel/OnlineTimers.svelte';
  import IdleCallbackRequestHistory from './panel/IdleCallbackRequestHistory.svelte';
  import IdleCallbackCancelHistory from './panel/IdleCallbackCancelHistory.svelte';
  import AnimationRequestHistory from './panel/AnimationRequestHistory.svelte';
  import AnimationCancelHistory from './panel/AnimationCancelHistory.svelte';
  import TimersSetHistory from './panel/TimersSetHistory.svelte';
  import TimersClearHistory from './panel/TimersClearHistory.svelte';

  let spinnerEl: TickSpinner | null = $state.raw(null);
  let paused = $state.raw(false);
  let telemetry: TTelemetry | null = $state.raw(null);
  let telemetryProgressive: TTelemetry | null = null;

  runtimeListen((o) => {
    if (o.msg === EMsg.CONTENT_SCRIPT_LOADED) {
      getSettings().then((settings) => {
        if (settings.devtoolsPanelShown && !settings.paused) {
          portPost({ msg: EMsg.START_OBSERVE });
        }
      });
    } else if (o.msg === EMsg.TELEMETRY) {
      telemetryProgressive = structuredClone(o.telemetry);
      telemetry = o.telemetry;
      acknowledgeTelemetry(o.timeOfCollection);
    } else if (o.msg === EMsg.TELEMETRY_DELTA) {
      diff.patch(telemetryProgressive, o.telemetryDelta);
      telemetry = structuredClone(telemetryProgressive);
      acknowledgeTelemetry(o.timeOfCollection);
    }
  });

  onMount(() => {
    getSettings().then((settings) => {
      paused = settings.paused;
    });

    globalThis.addEventListener('beforeunload', () => {
      portPost({ msg: EMsg.STOP_OBSERVE });
    });
  });

  function acknowledgeTelemetry(timeOfCollection: number) {
    portPost({
      msg: EMsg.TELEMETRY_ACKNOWLEDGED,
      timeOfCollection,
    });

    spinnerEl?.tick();
  }

  function onTogglePause() {
    paused = !paused;
    setSettings({ paused });

    if (paused) {
      portPost({ msg: EMsg.STOP_OBSERVE });
    } else {
      portPost({ msg: EMsg.START_OBSERVE });
    }
  }

  function onResetHistory() {
    portPost({ msg: EMsg.RESET_WRAPPER_HISTORY });
  }

  function onDevReload() {
    console.clear();
    chrome.storage.local.clear();
    chrome.storage.session.clear();
    location.reload();
  }
</script>

<section class="root">
  <header>
    {#if __development__}
      <button onclick={onDevReload} title="Reload" aria-label="Reload">
        <span class="icon -refresh"></span>
      </button>
      <div class="divider -thin"></div>
    {/if}
    <TogglePanels />
    <div class="divider -thin"></div>
    <button onclick={onTogglePause} title="Toggle pause">
      {#if paused}
        <span class="icon -play"></span>
      {:else}
        <span class="icon -pause"></span>
      {/if}
    </button>
    <div class="divider -thin"></div>
    <button
      onclick={onResetHistory}
      title="Reset history"
      aria-label="Reset history"
    >
      <span class="icon -clear"></span>
    </button>
    <div class="divider -thin"></div>

    <div class="infobar">
      {#if telemetry}
        <InfoBar
          mediaTotal={telemetry.media.total}
          activeTimers={telemetry.activeTimers}
          callCounter={telemetry.callCounter}
        />
      {/if}
    </div>

    {#if !paused}
      <div class="divider"></div>
      <TickSpinner bind:this={spinnerEl} />
    {/if}

    <div class="divider"></div>
    <Version />
    <div class="divider -anchor-right"></div>
  </header>

  <main>
    {#if telemetry}
      <Eval evalHistory={telemetry.evalHistory} />
      <Media media={telemetry.media} />
      <OnlineTimers onlineTimers={telemetry.onlineTimers} />

      {#if telemetry.setTimeoutHistory?.length}
        <TimersSetHistory
          caption="setTimeout History"
          setTimerHistory={telemetry.setTimeoutHistory}
          clearTimeoutHistory={telemetry.clearTimeoutHistory}
          clearIntervalHistory={telemetry.clearIntervalHistory}
        />
      {/if}
      {#if telemetry.clearTimeoutHistory?.length}
        <TimersClearHistory
          caption="clearTimeout History"
          clearTimerHistory={telemetry.clearTimeoutHistory}
        />
      {/if}

      {#if telemetry.setIntervalHistory?.length}
        <TimersSetHistory
          caption="setInterval History"
          setTimerHistory={telemetry.setIntervalHistory}
          clearTimeoutHistory={telemetry.clearTimeoutHistory}
          clearIntervalHistory={telemetry.clearIntervalHistory}
        />
      {/if}
      {#if telemetry.clearIntervalHistory?.length}
        <TimersClearHistory
          caption="clearInterval History"
          clearTimerHistory={telemetry.clearIntervalHistory}
        />
      {/if}

      {#if telemetry.rafHistory?.length}
        <AnimationRequestHistory
          caption="requestAnimationFrame History"
          rafHistory={telemetry.rafHistory}
          cafHistory={telemetry.cafHistory}
        />
      {/if}
      {#if telemetry.cafHistory?.length}
        <AnimationCancelHistory
          caption="cancelAnimationFrame History"
          cafHistory={telemetry.cafHistory}
        />
      {/if}

      {#if telemetry.ricHistory?.length}
        <IdleCallbackRequestHistory
          caption="requestIdleCallback History"
          ricHistory={telemetry.ricHistory}
          cicHistory={telemetry.cicHistory}
        />
      {/if}
      {#if telemetry.cicHistory?.length}
        <IdleCallbackCancelHistory
          caption="cancelIdleCallback History"
          cicHistory={telemetry.cicHistory}
        />
      {/if}
    {/if}
  </main>
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

      .infobar {
        display: flex;
        flex-wrap: wrap;
        flex-grow: 1;
        align-items: center;
      }
    }
    main {
      overflow-y: scroll;
      flex-grow: 1;
    }
  }
</style>
