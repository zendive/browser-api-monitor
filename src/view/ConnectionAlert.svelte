<script lang="ts">
  import { EMsg, portPost, runtimeListen } from '../api/communication.ts';
  import { Timer } from '../api/time.ts';
  import Alert from './shared/Alert.svelte';
  import {
    INJECTION_ALERT_TIMEOUT,
    UPDATE_SENSOR_INTERVAL,
  } from './shared/const.ts';
  import { onMount } from 'svelte';
  import { loadLocalStorage } from '../api/storage/storage.local.ts';

  let tabReloadAlertEl: Alert | null = null;
  let devtoolsReloadAlertEl: Alert | null = null;
  const delayedAlert = new Timer(
    { delay: INJECTION_ALERT_TIMEOUT },
    () => void tabReloadAlertEl?.show(),
  );
  const extensionUpdateSensor = new Timer(
    { delay: UPDATE_SENSOR_INTERVAL, repetitive: true },
    () => {
      whenUpdateDetected(() => {
        devtoolsReloadAlertEl?.show();
        extensionUpdateSensor.stop();
      });
    },
  );

  runtimeListen((o) => {
    if (o.msg === EMsg.INJECTION_CONFIRMED) {
      delayedAlert.stop();
      tabReloadAlertEl?.hide();
    } else if (o.msg === EMsg.CONTENT_SCRIPT_LOADED) {
      tabReloadAlertEl?.hide();
    }
  });

  onMount(() => {
    if (chrome.runtime) {
      pingContentScript();
      extensionUpdateSensor.start();
    }

    return () => {
      delayedAlert.stop();
      extensionUpdateSensor.stop();
    };
  });

  function pingContentScript() {
    portPost({ msg: EMsg.CONFIRM_INJECTION });
    delayedAlert.start();
  }

  /**
   * Detect extension code update by waiting for an indirect
   * symptom - when reading localStorage fails
   * @NOTE: `chrome.runtime.onInstalled.addListener` doesn't work in
   *    devtools panel script context
   */
  function whenUpdateDetected(callback: () => void) {
    loadLocalStorage().catch((e: Error) => {
      if (!e || e.message !== 'Extension context invalidated.') {
        return;
      }
      try {
        callback();
      } catch (_) {}
    });
  }
</script>

<Alert
  bind:this={tabReloadAlertEl}
  dismissable={false}
  title="Attention"
>
  <div>Tab reload required to continue live inspection</div>
</Alert>

<Alert
  bind:this={devtoolsReloadAlertEl}
  dismissable={false}
  title="Attention"
>
  <div>Devtools reload required to continue live inspection</div>
</Alert>
