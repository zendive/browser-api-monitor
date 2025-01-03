<script lang="ts">
  import type { TTrace } from '../../api/wrappers.ts';
  import { TAG_INVALID_CALLSTACK_LINK } from '../../api/const.ts';
  import {
    getSettings,
    onSettingsChange,
    setSettings,
  } from '../../api/settings.ts';
  import TraceLink from './TraceLink.svelte';

  let { trace, traceId }: { trace: TTrace[]; traceId: string } = $props();
  let traceForDebug: string | null = $state(null);
  let isTraceUnavailable = $derived.by(
    () => trace.length === 1 && trace[0].link === TAG_INVALID_CALLSTACK_LINK
  );

  getSettings().then((settings) => {
    traceForDebug = settings.traceForDebug;

    onSettingsChange((settings) => {
      traceForDebug = settings.traceForDebug;
    });
  });

  function onPlaceDebugger() {
    setSettings({
      traceForDebug:
        traceForDebug === traceId ? null : $state.snapshot(traceId),
    });
  }
</script>

{#each trace as stack, index (index)}
  {#if index !== 0}&nbsp;•{/if}
  <TraceLink link={stack.link} name={stack.name} />
{/each}

{#if isTraceUnavailable}
  <button onclick={onPlaceDebugger}
    >debugger{#if traceId === traceForDebug}
      🔖{/if}</button
  >
{/if}

<style lang="scss">
  button {
    border-right: none;
    color: var(--text);
    margin-left: 0.375rem;
  }
</style>
