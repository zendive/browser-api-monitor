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

<div class="sensor">
  <a
    href="void(0)"
    class:active={isBypassed}
    aria-label="Place bypass"
    onclick={onToggle}
  >
    <span class="icon -bypass"></span>
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
