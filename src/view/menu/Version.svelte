<script lang="ts">
  import {
    APPLICATION_HOME_PAGE,
    APPLICATION_RELEASE_PAGE,
    APPLICATION_VERSION,
  } from '../../api/env.ts';
  import { onMount } from 'svelte';
  import {
    isExtensionFresh,
    rememberCurrentVersion,
  } from '../../state/meta.state.ts';

  let isFresh = $state(false);

  onMount(async () => {
    isFresh = await isExtensionFresh();
  });

  function onClick() {
    rememberCurrentVersion();
    isFresh = false;
  }
</script>

{#if isFresh}
  <a
    target="_blank"
    href={APPLICATION_RELEASE_PAGE}
    title="What's new"
    class="is-fresh"
    onclick={onClick}
  >
    v{APPLICATION_VERSION}
  </a>
{:else}
  <a
    target="_blank"
    href={APPLICATION_HOME_PAGE}
    title={APPLICATION_HOME_PAGE}
  >
    v{APPLICATION_VERSION}
  </a>
{/if}

<style lang="scss">
  .is-fresh {
    color: var(--attention);
    font-weight: bold;
  }
</style>
