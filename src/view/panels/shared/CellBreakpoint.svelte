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

<div class="sensor">
  <a
    href="."
    role="button"
    class:active={isDebugged}
    aria-label="Place breakpoint"
    onclick={onToggle}
  >
    <span class="icon -breakpoint"></span>
  </a>
</div>

<style lang="scss">
  .sensor {
    a {
      visibility: hidden;
    }
    &:hover {
      a {
        visibility: visible;
        &:not(.active) .icon {
          background-color: var(--text-passive);
        }
      }
    }
    a.active {
      visibility: visible;
    }
  }
</style>
