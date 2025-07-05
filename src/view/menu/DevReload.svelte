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

<button
  onclick={onDevReload}
  title="Reload & Clear Storages"
  aria-label="Reload & Clear Storages"
>
  <span class="icon -refresh"></span>
</button>
