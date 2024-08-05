<script lang="ts">
  import type { TSettingsPanel } from '@/api/settings.ts';
  import Variable from '@/view/components/Variable.svelte';

  export let panel: TSettingsPanel;
  export let label: string;
  export let count: number;
  export let navSelector: string;
  export let tooltip: string = '';

  let enabled: boolean = false;
  let title: string = '';
  $: {
    enabled = panel.visible && count > 0;
    if (!panel.wrap) {
      title = `${tooltip ? tooltip + ' ' : ''}not wrapped`;
    } else {
      title = tooltip;
    }
  }

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

<a
  href="void(0)"
  class:panel-enabled={enabled}
  class:panel-unwrapped={!panel.wrap}
  on:click|preventDefault={scrollTo}
>
  <strong {title}>{label}</strong>: <Variable bind:value={count} />
</a>

<style lang="scss">
  a {
    cursor: default;
    padding: 0 0.4rem;
    border-right: 1px solid var(--border);

    &.panel-enabled {
      cursor: pointer;
      color: var(--text);
    }

    &.panel-unwrapped {
      text-decoration: line-through;
    }
  }
</style>
