<script lang="ts">
  import {
    getSettings,
    onSettingsChange,
    setSettings,
  } from '../../../api/settings.ts';

  let { traceId }: { traceId: string } = $props();
  let trace4Bypass: string | null = $state.raw(null);

  getSettings().then((settings) => {
    trace4Bypass = settings.trace4Bypass;

    onSettingsChange((settings) => {
      trace4Bypass = settings.trace4Bypass;
    });
  });

  function onToggle(e: MouseEvent) {
    e.preventDefault();

    setSettings({
      trace4Bypass: trace4Bypass === traceId
        ? null
        : $state.snapshot(traceId),
    });
  }
</script>

<div class="sensor">
  <a
    href="void(0)"
    class:active={trace4Bypass === traceId}
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
