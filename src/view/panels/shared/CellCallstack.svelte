<script lang="ts">
  import TraceLink from './TraceLink.svelte';
  import { type ITrace } from '../../../wrapper/shared/TraceUtil.ts';
  import { useTelemetryState } from '../../../state/telemetry.state.svelte.ts';
  import { getDomainDescriptor } from './traceDomain.ts';

  let { trace }: { trace: ITrace[] } = $props();
  const ts = useTelemetryState();
  const domain = $derived.by(() =>
    getDomainDescriptor(trace, ts.telemetry?.locationOrigin || '')
  );
</script>

<span class="icon -small {domain.icon}" title={domain.name}></span>

{#each trace as { link, name }, index (index)}
  {#if index !== 0}&nbsp;•{/if}
  <TraceLink {link} {name} />
{/each}
