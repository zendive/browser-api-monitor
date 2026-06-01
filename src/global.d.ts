import 'svelte/elements';

declare module 'svelte/elements' {
  export interface HTMLAttributes<T> {
    'interestfor'?: string;
  }
}

export {};

declare global {
  const __development__: boolean;
  const __feat_dev_stats__: boolean;
  const __app_name__: string;
  const __app_version__: string;
  const __home_page__: string;
  const __release_page__: string;
  const __mirror__: boolean;

  /**
   * Reverse engineered (not complete) callback argument for
   * - chrome.devtools.panels.openResource
   */
  interface IOpenResourceCallbackArgument {
    code: 'E_NOTFOUND';
    description: string;
    details: string[];
    isError: boolean;
  }
}
