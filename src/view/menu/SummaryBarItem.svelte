<script lang="ts">
  import type { TPanel } from '../../api/storage/storage.local.ts';
  import Variable from '../shared/Variable.svelte';

  let {
    panel,
    label,
    count,
    navSelector,
    tooltip = '',
  }: {
    panel: TPanel;
    label: string;
    count: number;
    navSelector: string;
    tooltip?: string;
  } = $props();
  let enabled: boolean = $derived.by(() => panel.visible && count > 0);

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
      null,
    ).singleNodeValue;

    if (el instanceof HTMLElement) {
      el.scrollIntoView({
        behavior: 'instant',
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
    onclick={(e) => {
      e.preventDefault();
      scrollTo();
    }}
  >
    <strong title={tooltip}>{label}</strong>: <Variable value={count} />
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
