import { mount } from 'svelte';
import App from './view/App.svelte';
import { initConfigState } from './state/config.state.svelte.ts';
import { onHidePanel } from './devtoolsPanelUtil.ts';
import { establishTelemetryReceiver } from './state/telemetry.state.svelte.ts';

initConfigState().then(() => {
  mount(App, { target: document.body });
  establishTelemetryReceiver();
  globalThis.addEventListener('beforeunload', onHidePanel);
});
