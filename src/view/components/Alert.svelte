<script lang="ts">
  export let title: string = '';
  export let dismissable: boolean = true;
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
      document.addEventListener('keydown', onKeyboardEvent, { capture: true });
      window.addEventListener('click', onWindowClick);
    } else if (e.newState === 'closed') {
      document.removeEventListener('keydown', onKeyboardEvent, {
        capture: true,
      });
      window.removeEventListener('click', onWindowClick);
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

<div popover="manual" bind:this={selfEl} class="alert" on:toggle={onToggle}>
  <header>
    <div class="title">{title}</div>
    {#if dismissable}
      <a
        title="Close"
        aria-label="Close"
        class="close-icon"
        href="void(0)"
        on:click|preventDefault={hide}><span class="icon -remove"></span></a
      >
    {/if}
  </header>
  <footer>
    <slot />
  </footer>
</div>

<style lang="scss">
  .alert {
    background-color: var(--bg-invert);
    color: var(--text-invert);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 1rem;

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
