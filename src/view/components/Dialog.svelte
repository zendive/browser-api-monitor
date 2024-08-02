<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let title: string = '';
  export let description: string = '';
  let selfEl: HTMLDialogElement | null = null;
  let showContent: boolean = false;
  const dispatch = createEventDispatcher();

  export function showModal() {
    selfEl?.showModal();
    document.addEventListener('keydown', onKeyboardEvent, { capture: true });
    selfEl?.addEventListener('click', onWindowClick);
    showContent = true;
  }

  function onClose() {
    document.removeEventListener('keydown', onKeyboardEvent, { capture: true });
    selfEl?.removeEventListener('click', onWindowClick);
    showContent = false;
    selfEl?.close();
    dispatch('closeDialog');
  }

  function onWindowClick(e: MouseEvent) {
    if (e.currentTarget === e.target) {
      onClose();
    }
  }

  function onKeyboardEvent(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      onClose();
    }
  }
</script>

<dialog bind:this={selfEl}>
  {#if showContent}
    <header>
      <div class="title">
        {#if title}
          {title}
        {/if}
        {#if description}
          <div class="description">{description}</div>
        {/if}
      </div>

      <a
        title="Close"
        class="close-icon"
        href="void(0)"
        on:click|preventDefault={onClose}
      >
        <span class="icon -remove" />
      </a>
    </header>

    <slot />
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
