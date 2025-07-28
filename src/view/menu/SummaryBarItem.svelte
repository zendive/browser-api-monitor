<script lang="ts">
  import type { TPanel } from '../../api/storage/storage.local.ts';
  import Variable from '../shared/Variable.svelte';
  import { ETimer, Timer } from '../../api/time.ts';
  import {
    AFTER_SCROLL_ANIMATION_CLASSNAME,
    SCROLLABLE_CLASSNAME,
  } from '../shared/const.ts';

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
  const stopAnimate = new Timer(
    { type: ETimer.TIMEOUT, delay: 512 },
    (el: HTMLElement | unknown) => {
      if (el instanceof HTMLElement) {
        el.classList.remove(AFTER_SCROLL_ANIMATION_CLASSNAME);
      }
    },
  );

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
    const main = document.querySelector(`.${SCROLLABLE_CLASSNAME}`);

    if (main && el instanceof HTMLElement) {
      const elBcr = el.getBoundingClientRect();
      const mainBcr = main.getBoundingClientRect();

      main.scrollBy(0, elBcr.y - mainBcr.y);

      if (stopAnimate.isPending()) {
        stopAnimate.stop();
      }
      el.classList.add(AFTER_SCROLL_ANIMATION_CLASSNAME);
      stopAnimate.start(el);
    }
  }
</script>

{#if panel.wrap !== false}
  <a
    href="."
    role="button"
    title={tooltip}
    class:link-disabled={!enabled}
    onclick={(e) => {
      e.preventDefault();
      scrollTo();
    }}
  >
    <strong>{label}</strong>: <Variable value={count} />
  </a>
{/if}

<style lang="scss">
  a {
    padding: 0 0.4rem;
    &:not(:last-of-type) {
      border-right: 1px solid var(--border);
    }

    &.link-disabled {
      cursor: default;
      color: var(--text-passive);

      &:hover {
        text-decoration: none;
      }
    }
  }
</style>
