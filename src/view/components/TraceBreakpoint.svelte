<script lang="ts">
  import {
    getSettings,
    setSettings,
    onSettingsChange,
  } from '../../api/settings.ts';

  let { traceId }: { traceId: string } = $props();
  let traceForDebug: string | null = $state.raw(null);

  getSettings().then((settings) => {
    traceForDebug = settings.traceForDebug;

    onSettingsChange((settings) => {
      traceForDebug = settings.traceForDebug;
    });
  });

  function onToggleBreakpoint(e: MouseEvent) {
    e.preventDefault();

    setSettings({
      traceForDebug:
        traceForDebug === traceId ? null : $state.snapshot(traceId),
    });
  }
</script>

<div class="sensor">
  <a
    href="void(0)"
    class:active={traceForDebug === traceId}
    aria-label="Place breakpoint"
    onclick={onToggleBreakpoint}
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
