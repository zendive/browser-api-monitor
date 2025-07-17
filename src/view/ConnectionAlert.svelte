<script lang="ts">
  import { EMsg, portPost, runtimeListen } from '../api/communication.ts';
  import { Timer } from '../api/time.ts';
  import Alert from './shared/Alert.svelte';
  import { INJECTION_ALERT_TIMEOUT } from './shared/const.ts';

  let alertEl: Alert | null = null;
  const delayedAlert = new Timer(
    { delay: INJECTION_ALERT_TIMEOUT },
    () => void alertEl?.show(),
  );

  runtimeListen((o) => {
    if (o.msg === EMsg.INJECTION_CONFIRMED) {
      delayedAlert.stop();
      alertEl?.hide();
    } else if (o.msg === EMsg.CONTENT_SCRIPT_LOADED) {
      alertEl?.hide();
    }
  });

  portPost({ msg: EMsg.CONFIRM_INJECTION });
  delayedAlert.start();
</script>

<Alert
  bind:this={alertEl}
  dismissable={false}
  title="Attention"
>
  <div>Tab reload required to continue live inspection</div>
</Alert>
