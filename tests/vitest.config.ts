import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  root: import.meta.dirname,
  test: {
    reporters: 'dot',
    projects: [
      {
        define: { __mirror__: 'false' },
        test: {
          include: ['./**/*_test.[tj]s'],
          browser: {
            instances: [{ browser: 'chromium' }],
            provider: playwright({
              launchOptions: {
                // executablePath: '/snap/bin/chromium',
                // executablePath: '/usr/bin/google-chrome',
              },
            }),
            screenshotFailures: false,
            enabled: true,
          },
        },
      },
    ],
  },
});
