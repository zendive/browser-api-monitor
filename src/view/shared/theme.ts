export type TColourScheme = 'light' | 'dark';

export function onColourSchemeChange(
  callback: (scheme: TColourScheme) => void,
) {
  const devtoolsScheme = chrome?.devtools?.panels.themeName;
  const osDarkScheme = globalThis.matchMedia('(prefers-color-scheme: dark)');
  const onChange = function (e: MediaQueryListEvent) {
    callback(e.matches ? 'dark' : 'light');
  };

  if (devtoolsScheme === 'dark' || osDarkScheme.matches) {
    callback('dark');
  } else {
    callback('light');
  }

  osDarkScheme.addEventListener('change', onChange);

  return function offColourSchemeChange() {
    osDarkScheme.removeEventListener('change', onChange);
  };
}
