<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import type { TFindRegressorCallback } from '../../shared/util.ts';

  let {
    calls,
    canceledCounter,
    canceledByTraceIds,
    onClick,
  }: {
    calls: number;
    canceledCounter: number;
    canceledByTraceIds: string[] | null;
    onClick: TFindRegressorCallback;
  } = $props();
</script>

<Variable value={calls} />
{#if canceledCounter}
  <a
    href="."
    role="button"
    title="&lt;called&gt; [&lt;aborted&gt;/&lt;abort-locations&gt;]"
    onclick={(e) => {
      e.preventDefault();
      onClick(canceledByTraceIds);
    }}
  >
    [<Variable value={canceledCounter} />/{canceledByTraceIds?.length}]
  </a>
{/if}
