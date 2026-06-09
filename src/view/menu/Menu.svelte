<script lang="ts">
  import Version from './Version.svelte';
  import TogglePanels from './TogglePanels.svelte';
  import DevReload from './DevReload.svelte';
  import TogglePause from './TogglePause.svelte';
  import UpdatePace from './UpdatePace.svelte';
  import DevDumpTelemetry from './DevDumpTelemetry.svelte';
  import DevStats from './DevStats.svelte';
</script>

<div class="menu">
  <TogglePanels />
  <div class="divider -thin"></div>
  <TogglePause />
  <div class="divider -thin"></div>
  {#if __development__}
    <DevReload />
    <div class="divider -thin"></div>
    <DevDumpTelemetry />
    <div class="divider -thin"></div>
  {/if}
  <div class="-spring"></div>
  <div class="divider"></div>
  {#if __feat_dev_stats__}
    <DevStats />
    <div class="divider"></div>
  {/if}
  <UpdatePace />
  <div class="divider"></div>
  <Version />
  <div class="divider -anchor-right"></div>
</div>

<style lang="scss">
  .menu {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border);
    height: 1.5rem;

    .-spring {
      flex-grow: 1;
    }
  }
</style>
