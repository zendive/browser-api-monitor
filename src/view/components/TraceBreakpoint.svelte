<script lang="ts">
  import {
    getSettings,
    setSettings,
    onSettingsChange,
  } from '../../api/settings.ts';

  let { traceId }: { traceId: string } = $props();
  let trace4Debug: string | null = $state.raw(null);

  getSettings().then((settings) => {
    trace4Debug = settings.trace4Debug;

    onSettingsChange((settings) => {
      trace4Debug = settings.trace4Debug;
    });
  });

  function onToggle(e: MouseEvent) {
    e.preventDefault();

    setSettings({
      trace4Debug: trace4Debug === traceId ? null : $state.snapshot(traceId),
    });
  }
</script>

<div class="sensor">
  <a
    href="void(0)"
    class:active={trace4Debug === traceId}
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
