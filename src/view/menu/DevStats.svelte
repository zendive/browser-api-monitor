<script lang="ts">
  import { useTelemetryState } from '../../state/telemetry.state.svelte.ts';
  import { inKilo } from '../shared/util.ts';

  const ts = useTelemetryState();
  let telemetrySize = $derived.by(() => inKilo(ts.telemetrySize));
</script>

<span title="Telemetry size">{telemetrySize}</span>

<style lang="scss">
  span {
    padding: 0 0.5rem;
  }
</style>
