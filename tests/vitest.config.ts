import { defineConfig, type TestProjectConfiguration } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const project: TestProjectConfiguration = {
  define: { __mirror__: 'false' },
  test: {
    include: ['./**/*_test.[tj]s'],
    browser: {
      instances: [{ browser: 'chromium' }],
      provider: playwright(),
      screenshotFailures: false,
      enabled: true,
    },
  },
};

export default defineConfig({
  root: import.meta.dirname,
  test: {
    reporters: 'dot',
    projects: [project],
  },
});
