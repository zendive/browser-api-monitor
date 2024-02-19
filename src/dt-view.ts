import App from './view/App.svelte';

const app = new App({
  target: document.body,
  props: {
    isDev: __development__,
  },
});

export default app;
