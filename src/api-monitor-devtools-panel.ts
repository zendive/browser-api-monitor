import { onColourSchemeChange } from '@/api/ui-theme.ts';
import App from '@/view/App.svelte';

onColourSchemeChange((theme) => {
  document.body.setAttribute('class', theme);
});

const app = new App({
  target: document.body,
});

export default app;
