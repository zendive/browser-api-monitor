<script lang="ts">
  import type { ISchedulerTelemetry } from '../../../wrapper/SchedulerWrapper.ts';
  import SchedulerPostTask from './SchedulerPostTask.svelte';
  import SchedulerYield from './SchedulerYield.svelte';

  let { telemetry }: { telemetry: ISchedulerTelemetry } = $props();
</script>

{#if telemetry.postTask?.length}
  <SchedulerPostTask metrics={telemetry.postTask} />
{/if}

{#if telemetry.yield?.length}
  <SchedulerYield metrics={telemetry.yield} />
{/if}
