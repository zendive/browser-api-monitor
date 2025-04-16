<script lang="ts">
  import Variable from '../../components/Variable.svelte';

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
    role="button"
    href="void(0)"
    title="<called> [<aborted>/<abort-locations>]"
    onclick={(e) => {
      e.preventDefault();
      onClick(canceledByTraceIds);
    }}
  >
    [<Variable value={canceledCounter} />/{canceledByTraceIds?.length}]
  </a>
{/if}
