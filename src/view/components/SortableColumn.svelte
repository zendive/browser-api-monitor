<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ESortOrder } from '../../api/settings.ts';

  let {
    field,
    currentField,
    currentFieldOrder,
    eventChangeSorting,
    children,
  }: {
    field: string;
    currentField: string;
    currentFieldOrder: ESortOrder;
    eventChangeSorting: (field: string, order: ESortOrder) => void;
    children?: Snippet;
  } = $props();

  function changeSort(e: MouseEvent) {
    e.preventDefault();

    eventChangeSorting(
      field,
      field !== currentField
        ? ESortOrder.DESCENDING
        : currentFieldOrder === ESortOrder.DESCENDING
        ? ESortOrder.ASCENDING
        : ESortOrder.DESCENDING,
    );
  }
</script>

<a
  href="voidESortOrder"
  role="cell"
  tabindex="-1"
  onclick={changeSort}
  title="Sort by&mldr;"
>
  {@render children?.()}
  {#if field === currentField}
    <span
      class="icon -small"
      class:-up={currentFieldOrder === ESortOrder.ASCENDING}
      class:-down={currentFieldOrder === ESortOrder.DESCENDING}
    ></span>
  {/if}
</a>

<style lang="scss">
  a {
    display: inline-flex;
    align-items: center;
    text-wrap: nowrap;
    color: var(--text-invert);
  }
</style>
