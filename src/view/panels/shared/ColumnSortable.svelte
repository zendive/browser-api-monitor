<script
  lang="ts"
  generics="TField, TSort extends { field: TField; order: ESortOrder }"
>
  import type { Snippet } from 'svelte';
  import { ESortOrder } from '../../../api/const.ts';

  let {
    sort,
    by,
    update,
    children,
  }: {
    sort: TSort;
    by: TSort['field'];
    update: (field: TField, order: ESortOrder) => void;
    children?: Snippet;
  } = $props();

  const ORDER_MAP = {
    [ESortOrder.ASCENDING]: ' ascending',
    [ESortOrder.DESCENDING]: ' descending',
  };
  let tooltip = $derived.by(() => {
    let rv = `Sort by ${by}`;
    if (by === sort.field) {
      rv += ORDER_MAP[sort.order];
    }
    return rv;
  });

  function changeSort(e: MouseEvent) {
    e.preventDefault();
    update(
      by,
      by !== sort.field
        ? ESortOrder.DESCENDING
        : sort.order === ESortOrder.DESCENDING
        ? ESortOrder.ASCENDING
        : ESortOrder.DESCENDING,
    );
  }
</script>

<a
  href="."
  role="cell"
  tabindex="0"
  onclick={changeSort}
  title={tooltip}
>
  {@render children?.()}
  {#if by === sort.field}
    <span
      class="icon -small"
      class:-up={sort.order === ESortOrder.ASCENDING}
      class:-down={sort.order === ESortOrder.DESCENDING}
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
