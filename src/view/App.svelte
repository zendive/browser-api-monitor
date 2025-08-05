<script lang="ts">
  import Panels from './panels/Panels.svelte';
  import Menu from './menu/Menu.svelte';
  import { SCROLLABLE_CLASSNAME } from './shared/const.ts';
  import ConnectionAlert from './ConnectionAlert.svelte';
</script>

<section>
  <header>
    <Menu />
  </header>
  <main class={SCROLLABLE_CLASSNAME}>
    <Panels />
  </main>

  <ConnectionAlert />
</section>

<style lang="scss">
  section {
    display: flex;
    flex-direction: column;
    height: 100%;

    header {
      display: flex;
      align-items: center;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      user-select: none;
    }

    main {
      overflow-y: scroll;
      flex-grow: 1;
    }
  }
</style>
