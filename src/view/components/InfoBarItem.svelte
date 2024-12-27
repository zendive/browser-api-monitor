<script lang="ts">
  import type { TSettingsPanel } from '@/api/settings.ts';
  import Variable from '@/view/components/Variable.svelte';

  export let panel: TSettingsPanel;
  export let label: string;
  export let count: number;
  export let navSelector: string;
  export let tooltip: string = '';

  $: enabled = panel.visible && count > 0;

  function scrollTo() {
    const condition = navSelector
      .split('|')
      .map((caption) => `contains(@data-navigation-tag,'${caption}')`)
      .join(' or ');
    const el = document.evaluate(
      `//node()[${condition}]`,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    if (el instanceof HTMLElement) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
  }
</script>

{#if panel.wrap !== false}
  <a
    href="void(0)"
    class:link-disabled={!enabled}
    on:click|preventDefault={scrollTo}
  >
    <strong title={tooltip}>{label}</strong>: <Variable bind:value={count} />
  </a>
{/if}

<style lang="scss">
  a {
    padding: 0 0.4rem;
    border-right: 1px solid var(--border);

    &.link-disabled {
      cursor: default;
      color: var(--text-passive);

      &:hover {
        text-decoration: none;
      }
    }
  }
</style>
