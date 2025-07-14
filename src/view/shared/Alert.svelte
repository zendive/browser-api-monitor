<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title = '',
    dismissable = true,
    class: className = '',
    children,
  }: {
    title: string;
    dismissable?: boolean;
    class?: string;
    children?: Snippet;
  } = $props();
  let selfEl: HTMLElement | null = null;

  export function show() {
    selfEl?.showPopover();
  }

  export function hide() {
    selfEl?.hidePopover();
  }

  function onToggle(e: ToggleEvent) {
    if (!dismissable) {
      return;
    }

    if (e.newState === 'open') {
      document.addEventListener('keydown', onKeyboardEvent, {
        capture: true,
      });
      globalThis.addEventListener('click', onWindowClick);
    } else if (e.newState === 'closed') {
      document.removeEventListener('keydown', onKeyboardEvent, {
        capture: true,
      });
      globalThis.removeEventListener('click', onWindowClick);
    }
  }

  function onWindowClick(e: MouseEvent) {
    if (selfEl && e.target && !selfEl.contains(e.target as Node)) {
      hide();
    }
  }

  function onKeyboardEvent(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      hide();
    }
  }
</script>

<div
  popover="manual"
  bind:this={selfEl}
  class="alert {className}"
  ontoggle={onToggle}
>
  <header>
    <div class="title">{title}</div>
    {#if dismissable}
      <a
        title="Close"
        aria-label="Close"
        class="close-icon"
        href="void(0)"
        onclick={(e) => {
          e.preventDefault();
          hide();
        }}
      ><span class="icon -remove"></span></a>
    {/if}
  </header>
  <footer>
    {@render children?.()}
  </footer>
</div>

<style lang="scss">
  .alert {
    background-color: var(--bg-invert);
    color: var(--text-invert);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 1rem;
    max-width: 22rem;

    header {
      display: flex;
      flex-wrap: nowrap;
      padding-bottom: 0.5rem;

      .title {
        flex-grow: 1;
        font-size: large;
        font-weight: bold;
      }

      .icon {
        background-color: var(--text-invert);
      }
    }

    footer {
      font-size: medium;
    }
  }
</style>
