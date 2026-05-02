<script lang="ts">
  import Variable from '../../shared/Variable.svelte';

  let {
    specifier,
    online,
  }: {
    specifier: string;
    online: number;
  } = $props();
  const possiblyDestroyed = $derived.by(() =>
    !online && specifier.startsWith('blob')
  );

  function openSpecifier(e: MouseEvent) {
    e.preventDefault();
    chrome?.devtools?.panels.openResource(
      String(specifier),
      0,
      0,
      // @ts-expect-error: incomplete documentation for callback argument
      (acknowledge: IOpenResourceCallbackArgument) => {
        if (acknowledge.isError && acknowledge.code == 'E_NOTFOUND') {
          // try to open resource in another way
          globalThis.open(specifier, '_blank');
        }
      },
    );
  }
</script>

<a
  href="../worker"
  title="Open Specifier"
  aria-label="Open Specifier"
  role="button"
  onclick={openSpecifier}
  class:tc-passive={possiblyDestroyed}
>{specifier}</a>

{#if online}
  <span title="Active Workers">
    [<Variable value={online} />]
  </span>
{/if}
