<script lang="ts">
  import { runtimeListen, portPost } from '@/api/communication';
  export let isDev: boolean;

  let videosCount = 0;
  let timestamp = 0;
  let csTabs: number[] = [];
  let updates = 0;

  function onPostTabId() {
    portPost('from-panel', { tabId: chrome.devtools.inspectedWindow.tabId });
  }

  runtimeListen('from-cs-main', (o) => {
    videosCount = o.videosCount;
    timestamp = o.timestamp;
    csTabs = o.tabIds;
    updates++;
  });

  console.log('App.svelte', chrome.devtools.inspectedWindow.tabId);
</script>

<main>
  {#if isDev}<button on:click={() => location.reload()}>Reload</button>{/if}
  <button on:click={onPostTabId}>post tab id</button>

  <p>{updates}</p>
  <p>videos: {videosCount}, timestamp: {timestamp}</p>
  <p>csTabs: {csTabs.join(',')}</p>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }
</style>
