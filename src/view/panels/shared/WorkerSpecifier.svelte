<script lang="ts">
  import Variable from '../../shared/Variable.svelte';

  let {
    specifier,
    online,
    inMemory,
  }: {
    specifier: string;
    online?: number;
    inMemory: number;
  } = $props();
  const possiblyDestroyed = $derived.by(() =>
    online === 0 && specifier.startsWith('blob')
  );

  function openSpecifier(e: MouseEvent) {
    e.preventDefault();
    chrome?.devtools?.panels.openResource(
      specifier,
      0,
      0,
      // @ts-expect-error: incomplete documentation for callback argument
      (acknowledge: IOpenResourceCallbackArgument) => {
        if (
          typeof acknowledge === 'object' &&
          acknowledge.isError &&
          acknowledge.code === 'E_NOTFOUND'
        ) {
          // try to open resource in another way
          globalThis.open(specifier, '_blank');
        } else {
          console.error(acknowledge);
        }
      },
    );
  }
</script>

<a
  href={specifier}
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

{#if inMemory}
  <span title="Workers in memory">
    &lbrace;<Variable value={inMemory} />&rbrace;
  </span>
{/if}
