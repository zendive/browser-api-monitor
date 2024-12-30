<script lang="ts">
  import type { TTrace } from '../../api/wrappers.ts';
  import { TAG_INVALID_CALLSTACK_LINK } from '../../api/const.ts';
  import {
    getSettings,
    onSettingsChange,
    setSettings,
  } from '../../api/settings.ts';
  import TraceLink from './TraceLink.svelte';

  export let trace: TTrace[];
  export let traceId: string;

  let traceForDebug: string | null = null;
  $: hardToGet =
    trace.length === 1 && trace[0].link === TAG_INVALID_CALLSTACK_LINK;

  getSettings().then((settings) => {
    traceForDebug = settings.traceForDebug;

    onSettingsChange((settings) => {
      traceForDebug = settings.traceForDebug;
    });
  });

  function onPlaceDebugger() {
    setSettings({ traceForDebug: traceForDebug === traceId ? null : traceId });
  }
</script>

{#each trace as stack, index (index)}
  {#if index !== 0}&nbsp;•{/if}
  <TraceLink bind:link={stack.link} bind:name={stack.name} />
{/each}

{#if hardToGet}
  <button on:click={onPlaceDebugger}
    >debugger {#if traceId === traceForDebug}🔖{/if}</button
  >
{/if}

<style lang="scss">
  button {
    border-right: none;
    color: var(--text);
    margin-left: 0.375rem;
  }
</style>
