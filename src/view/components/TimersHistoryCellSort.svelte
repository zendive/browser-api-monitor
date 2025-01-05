<script lang="ts">
  import type { Snippet } from 'svelte';
  import {
    SortOrder,
    type THistorySortField,
    type TSortOrder,
  } from '../../api/settings.ts';

  let {
    field,
    currentField,
    currentFieldOrder,
    eventChangeSorting,
    children,
  }: {
    field: THistorySortField;
    currentField: THistorySortField;
    currentFieldOrder: TSortOrder;
    eventChangeSorting: (field: THistorySortField, order: TSortOrder) => void;
    children?: Snippet;
  } = $props();

  function changeSort(e: MouseEvent) {
    e.preventDefault();

    eventChangeSorting(
      field,
      field !== currentField
        ? SortOrder.DESCENDING
        : currentFieldOrder === SortOrder.DESCENDING
          ? SortOrder.ASCENDING
          : SortOrder.DESCENDING
    );
  }
</script>

<a
  href="void(0)"
  role="cell"
  tabindex="-1"
  onclick={changeSort}
  title="Sort by&mldr;"
>
  {@render children?.()}
  {#if field === currentField}
    <span
      class="icon -small"
      class:-up={currentFieldOrder === SortOrder.ASCENDING}
      class:-down={currentFieldOrder === SortOrder.DESCENDING}
    ></span>
  {/if}
</a>

<style lang="scss">
  a {
    display: inline-flex;
    align-items: center;
    text-wrap: nowrap;
    color: var(--text-invert);

    .icon {
      background-color: var(--text-invert);
    }
  }
</style>
