<script lang="ts">
  import { local, session } from '../../api/storage/storage.ts';

  async function onDevReload() {
    await Promise.all([
      local.clear(),
      session.clear(),
    ]);
    location.reload();
  }
</script>

<button onclick={onDevReload} title="Reload" aria-label="Reload">
  <span class="icon -refresh"></span>
</button>
