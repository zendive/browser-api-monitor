<script lang="ts">
  import { EMsg, portPost } from '../../api/communication.ts';

  function onResetHistory() {
    portPost({ msg: EMsg.RESET_WRAPPER_HISTORY });
  }
</script>

<button
  onclick={onResetHistory}
  title="Reset history"
  aria-label="Reset history"
>
  <span class="icon -clear"></span>
</button>
