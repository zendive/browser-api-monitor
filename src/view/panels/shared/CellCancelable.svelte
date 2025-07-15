<script lang="ts">
  import Variable from '../../shared/Variable.svelte';

  let {
    calls,
    canceledCounter,
    canceledByTraceIds,
    onClick,
  }: {
    calls: number;
    canceledCounter: number;
    canceledByTraceIds: string[] | null;
    onClick: (canceledByTraceIds: string[] | null) => void;
  } = $props();
</script>

<Variable value={calls} />
{#if canceledCounter}
  <a
    href="."
    role="button"
    title="<called> [<aborted>/<abort-locations>]"
    onclick={(e) => {
      e.preventDefault();
      onClick(canceledByTraceIds);
    }}
  >
    [<Variable value={canceledCounter} />/{canceledByTraceIds?.length}]
  </a>
{/if}
