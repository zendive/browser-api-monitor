<script lang="ts">
  import {
    sessionState,
    toggleDebug,
  } from '../../../state/session.state.svelte.ts';

  let { traceId }: { traceId: string } = $props();
  let isDebugged = $derived.by(() => {
    return sessionState.debug.has(traceId);
  });

  async function onToggle(e: MouseEvent) {
    e.preventDefault();
    await toggleDebug(traceId);
  }
</script>

<button
  type="button"
  aria-label="Place breakpoint"
  class:active={isDebugged}
  onclick={onToggle}
>
  <span class="icon -breakpoint"></span>
</button>

<style lang="scss">
  .icon {
    visibility: hidden;
  }
  button:is(:hover, :focus) {
    &:not(.active) .icon {
      background-color: var(--text-passive);
    }
    .icon {
      visibility: visible;
    }
  }
  button.active .icon {
    visibility: visible;
  }
</style>
