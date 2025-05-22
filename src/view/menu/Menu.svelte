<script lang="ts">
  import ResetHistory from './ResetHistory.svelte';
  import SummaryBar from './SummaryBar.svelte';
  import Version from './Version.svelte';
  import TogglePanels from './TogglePanels.svelte';
  import DevReload from './DevReload.svelte';
  import TogglePause from './TogglePause.svelte';
  import UpdatePace from './UpdatePace.svelte';
</script>

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
