<script lang="ts">
  export let isDev: boolean;
</script>

<main>
  {#if isDev}<button on:click={() => location.reload()}>Reload</button>{/if}
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }
</style>
