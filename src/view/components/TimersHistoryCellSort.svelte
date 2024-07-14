<script lang="ts">
  import { DEFAULT_SETTINGS, ESortOrder } from '@/api/settings.ts';
  import { createEventDispatcher } from 'svelte';

  export let field = DEFAULT_SETTINGS.sort.timersHistoryField;
  export let currentField = DEFAULT_SETTINGS.sort.timersHistoryField;
  export let currentFieldOrder = DEFAULT_SETTINGS.sort.timersHistoryOrder;

  const dispatch = createEventDispatcher();

  function changeSort(e: MouseEvent) {
    e.preventDefault();

    dispatch('changeSort', {
      field: field,
      order:
        field !== currentField
          ? ESortOrder.DESCENDING
          : currentFieldOrder === ESortOrder.DESCENDING
            ? ESortOrder.ASCENDING
            : ESortOrder.DESCENDING,
    });
  }
</script>

<a
  href="void(0)"
  role="cell"
  tabindex="-1"
  on:click={changeSort}
  title="Sort by&mldr;"
>
  <slot />
  {#if field === currentField}
    <span
      class="icon -small"
      class:-up={currentFieldOrder === ESortOrder.ASCENDING}
      class:-down={currentFieldOrder === ESortOrder.DESCENDING}
    />
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
