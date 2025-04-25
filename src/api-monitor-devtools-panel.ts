import { mount } from 'svelte';
import App from './view/App.svelte';
import { initConfigState } from './state/config.state.svelte.ts';
import { onHidePanel } from './devtoolsPanelUtil.ts';

initConfigState().then(() => {
  mount(App, { target: document.body });
  globalThis.addEventListener('beforeunload', onHidePanel);
});
