<script lang="ts">
  async function onDevReload() {
    await Promise.all([
      chrome.storage.local.clear(),
      chrome.storage.session.clear(),
    ]);
    location.reload();
  }
</script>

<button onclick={onDevReload} title="Reload" aria-label="Reload">
  <span class="icon -refresh"></span>
</button>
