<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let title: string = '';
  export let description: string = '';
  let selfEl: HTMLDialogElement | null = null;
  let showContent: boolean = false;
  const dispatch = createEventDispatcher();

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
    dispatch('close');
  }
</script>

<dialog bind:this={selfEl} on:close={onClose}>
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
      on:click|preventDefault={hide}><span class="icon -remove"></span></a
    >
  </header>

  {#if showContent}
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
