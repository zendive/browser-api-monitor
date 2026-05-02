import 'svelte/elements';

declare module 'svelte/elements' {
  export interface HTMLAttributes<T> {
    'interestfor'?: string;
  }
}

export {};

declare global {
  let __development__: boolean;
  let __feat_dev_stats__: boolean;
  let __app_name__: string;
  let __app_version__: string;
  let __home_page__: string;
  let __release_page__: string;
  let __mirror__: boolean;

  /**
   * Reverse engineered (not complete) callback argument for
   * - chrome.devtools.panels.openResource
   */
  interface IOpenResourceCallbackArgument {
    code: 'E_NOTFOUND' | string;
    description: string;
    details: string[];
    isError: boolean;
  }
}
