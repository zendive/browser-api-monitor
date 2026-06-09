<script lang="ts">
  import Variable from '../../shared/Variable.svelte';

  let {
    calls,
    canceledCounter,
    canceledByTraceIds,
    popoverId,
    eventClick,
  }: {
    calls: number;
    canceledCounter: number;
    canceledByTraceIds: string[] | null;
    popoverId: string;
    eventClick: (e: Event) => void;
  } = $props();
</script>

<Variable value={calls} />
{#if canceledCounter}
  <button
    popovertarget={popoverId}
    title="&lt;called&gt; [&lt;aborted&gt;/&lt;abort-locations&gt;]"
    aria-label="show regressors"
    onclick={eventClick}
  >
    [<Variable value={canceledCounter} />/{canceledByTraceIds?.length}]
  </button>
{/if}
