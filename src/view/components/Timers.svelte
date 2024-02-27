<script lang="ts">
  import type { TMetrics } from '@/cs-main';
  import Variable from './Variable.svelte';
  import TimersMetrics from './TimersMetrics.svelte';

  export let invocations: TMetrics['timersInvocations'];
  export let usages: TMetrics['timersUsages'];
</script>

<section>
  <div>
    <span
      ><strong>setTimeout</strong>: <Variable
        bind:value={invocations.setTimeout}
      /></span
    >
    <span
      ><strong>clearTimeout</strong>: <Variable
        bind:value={invocations.clearTimeout}
      /></span
    >
    <TimersMetrics bind:metrics={usages.timeouts} />
  </div>

  <div>
    <span
      ><strong>setInterval</strong>: <Variable
        bind:value={invocations.setInterval}
      /></span
    >
    <span
      ><strong>clearInterval</strong>: <Variable
        bind:value={invocations.clearInterval}
      /></span
    >
    <TimersMetrics bind:metrics={usages.intervals} />
  </div>
</section>
