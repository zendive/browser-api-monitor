<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title = '',
    description = '',
    eventClose: closeEvent,
    children,
  }: {
    title: string;
    description: string;
    eventClose?: () => void;
    children?: Snippet;
  } = $props();
  let showContent: boolean = $state(false);
  let selfEl: HTMLDialogElement | null = null;

  export function show() {
    selfEl?.showModal();
    document.addEventListener('keydown', onKeyboardEvent, { capture: true });
    selfEl?.addEventListener('click', onSelfClick);
    showContent = true;
  }

  export function hide() {
    selfEl?.close();
  }

  function onSelfClick(e: MouseEvent) {
    if (e.currentTarget === e.target) {
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

  function onClose() {
    document.removeEventListener('keydown', onKeyboardEvent, { capture: true });
    selfEl?.removeEventListener('click', onSelfClick);
    showContent = false;
    closeEvent?.();
  }
</script>

<dialog bind:this={selfEl} onclose={onClose}>
  <header>
    <div class="title">
      {title}
      {#if description}
        <div class="description">{description}</div>
      {/if}
    </div>

    <a
      title="Close"
      aria-label="Close"
      class="close-icon"
      href="void(0)"
      onclick={(e) => {
        e.preventDefault();
        hide();
      }}><span class="icon -remove"></span></a
    >
  </header>

  {#if showContent}
    {@render children?.()}
  {/if}
</dialog>

<style lang="scss">
  dialog {
    background-color: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);

    header {
      display: flex;
      flex-wrap: nowrap;
      padding-bottom: 0.5rem;

      .title {
        flex-grow: 1;
        font-size: large;
        .description {
          font-size: x-small;
        }
      }

      .close-icon {
        text-decoration: none;
      }
    }
  }
</style>
