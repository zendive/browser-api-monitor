<script lang="ts">
  import {
    getSettings,
    setSettings,
    onSettingsChange,
  } from '../../api/settings.ts';

  let { traceId }: { traceId: string } = $props();
  let traceForBypass: string | null = $state.raw(null);

  getSettings().then((settings) => {
    traceForBypass = settings.traceForBypass;

    onSettingsChange((settings) => {
      traceForBypass = settings.traceForBypass;
    });
  });

  function onToggle(e: MouseEvent) {
    e.preventDefault();

    setSettings({
      traceForBypass:
        traceForBypass === traceId ? null : $state.snapshot(traceId),
    });
  }
</script>

<div class="sensor">
  <a
    href="void(0)"
    class:active={traceForBypass === traceId}
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
