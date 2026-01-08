<script lang="ts">
  import {
    sessionState,
    toggleBypass,
  } from '../../../state/session.state.svelte.ts';

  let { traceId }: { traceId: string } = $props();
  let isBypassed = $derived.by(() => {
    return sessionState.bypass.has(traceId);
  });

  async function onToggle(e: MouseEvent) {
    e.preventDefault();
    await toggleBypass(traceId);
  }
</script>

<button
  aria-label="Place bypass"
  class:active={isBypassed}
  onclick={onToggle}
>
  <span class="icon -bypass"></span>
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
