<script lang="ts">
  import SummaryBar from './SummaryBar.svelte';
  import Version from './Version.svelte';
  import TogglePanels from './TogglePanels.svelte';
  import DevReload from './DevReload.svelte';
  import TogglePause from './TogglePause.svelte';
  import UpdatePace from './UpdatePace.svelte';
  import DevDumpTelemetry from './DevDumpTelemetry.svelte';
</script>

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
<SummaryBar />
<div class="divider"></div>
<UpdatePace />
<div class="divider"></div>
<Version />
<div class="divider -anchor-right"></div>
