<script lang="ts">
  import Version from './menu/Version.svelte';
  import TogglePanels from './menu/TogglePanels.svelte';
  import SummaryBar from './menu/SummaryBar.svelte';
  import UpdatePace from './menu/UpdatePace.svelte';
  import AppPanels from './panel/components/AppPanels.svelte';
  import TogglePause from './menu/TogglePause.svelte';
  import ResetHistory from './menu/ResetHistory.svelte';
  import DevReload from './menu/DevReload.svelte';
</script>

<section>
  <header>
    <TogglePanels />
    <div class="divider -thin"></div>
    {#if __development__}
      <DevReload />
      <div class="divider -thin"></div>
    {/if}
    <TogglePause />
    <div class="divider -thin"></div>
    <ResetHistory />
    <div class="divider -thin"></div>
    <SummaryBar />
    <div class="divider"></div>
    <UpdatePace />
    <div class="divider"></div>
    <Version />
    <div class="divider -anchor-right"></div>
  </header>

  <main>
    <AppPanels />
  </main>
</section>

<style lang="scss">
  section {
    display: flex;
    flex-direction: column;
    height: 100%;

    header {
      display: flex;
      align-items: center;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      user-select: none;
    }

    main {
      overflow-y: scroll;
      flex-grow: 1;
    }
  }
</style>
