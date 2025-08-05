<script lang="ts">
  import { Stopper } from '../../../api/time.ts';
  import {
    ESelfTimeDisplayMode,
    FRAME_TIME_SAFE_THRESHOLD,
  } from '../../shared/const.ts';
  import CellSelfTimeStats from './CellSelfTimeStats.svelte';

  let { time }: { time: number | null } = $props();
  let modeCycles: ESelfTimeDisplayMode[] = [
    ESelfTimeDisplayMode.DEFAULT,
    ESelfTimeDisplayMode.STATS,
  ];
  let cycleIndex: number = $state(0);
  let displayMode: ESelfTimeDisplayMode = $derived.by(() =>
    modeCycles[cycleIndex]
  );

  function nextMode() {
    cycleIndex = (cycleIndex + 1) % modeCycles.length;
  }
</script>

{#if time !== null}
  <button
    class="self-time"
    class:-stats={displayMode === ESelfTimeDisplayMode.STATS}
    onclick={(e) => {
      e.preventDefault();
      nextMode();
    }}
  >
    {#if displayMode === ESelfTimeDisplayMode.DEFAULT}
      {@render SelfTimeSlot(time, 'recent')}
    {:else}
      <CellSelfTimeStats {time} {SelfTimeSlot} />
    {/if}
  </button>
{/if}

{#snippet SelfTimeSlot(time: number, title: string, tail?: string)}
  <span
    {title}
    class:maxed-out={time > FRAME_TIME_SAFE_THRESHOLD}
  >{Stopper.toString(time)}{tail}</span>
{/snippet}

<style lang="scss">
  .self-time {
    display: inline-block;
    font-size: 0.75rem;
    text-align: right;

    &.-stats {
      border-right: 1px solid var(--attention);
    }

    .maxed-out {
      color: var(--attention);
      font-weight: bold;
    }
  }
</style>
