<script lang="ts">
  import type { IMediaEventMetrics } from '../../../wrapper/MediaWrapper.ts';
  import Variable from '../../shared/Variable.svelte';
  import MediaEventAel from './MediaEventAel.svelte';
  import MediaEventRel from './MediaEventRel.svelte';

  let { mediaId, metric }: { mediaId: string; metric: IMediaEventMetrics } =
    $props();
  const hasListeners = $derived.by(() =>
    metric.ael.length || metric.rel.length
  );
  const popoverId = $derived.by(() => mediaId + metric.name);
  let popoverShown = $state(false);

  function onPopoverToggle(e: ToggleEvent) {
    popoverShown = e.newState !== 'closed';
  }
</script>

<tr class:-called={metric.calls > 0}>
  <td class="ta-r">
    {#if hasListeners}
      <strong class="tc-attention">ƒ</strong>
      <div
        popover="hint"
        ontoggle={onPopoverToggle}
        id={popoverId}
        class="metrics-popover"
        role="dialog"
      >
        <MediaEventAel metrics={metric.ael} />
        <MediaEventRel metrics={metric.rel} />
      </div>

      <button
        popovertarget={popoverId}
        interestfor={popoverId}
        class:popover-target-active={popoverShown}
      >
        {metric.name}
      </button>
    {:else}
      {metric.name}
    {/if}
  </td>
  <td class="ta-l value"><Variable value={metric.calls} /></td>
</tr>

<style lang="scss">
  tr {
    color: var(--text-passive);

    &.-called {
      font-weight: bold;
      color: var(--text);

      button {
        font-weight: bold;
      }
    }

    .value {
      padding-left: 0.25rem;
    }

    button {
      color: unset;
      padding: 0;
      font-size: 100%;
    }
  }
</style>
