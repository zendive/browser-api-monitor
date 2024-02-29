export async function fetchTheme() {
  const linkEl = document.createElement('link');
  linkEl.setAttribute(
    'href',
    `devtools://theme/colors.css?sets=ui,chrome&version=${Date.now()}`
  );
  linkEl.setAttribute('rel', 'stylesheet');
  linkEl.setAttribute('type', 'text/css');
  // chrome://resources/css/text_defaults_md.css

  const newColorsLoaded = new Promise<boolean>((resolve) => {
    linkEl.onload = resolve.bind(null, true);
    linkEl.onerror = resolve.bind(null, false);
  });
  const COLORS_CSS_SELECTOR = "link[href*='//theme/colors.css']";
  const prevLinkEl = document.querySelector(COLORS_CSS_SELECTOR);

  document.body.appendChild(linkEl);
  if (prevLinkEl && (await newColorsLoaded)) {
    prevLinkEl.remove();
  }
}

export type TColourScheme = 'light' | 'dark';

/**
 * NOTE: if OS is dark but devtools is default - then scheme is dark
 */
export function onColourSchemeChange(
  callback: (scheme: TColourScheme) => void
) {
  const devtoolsScheme = chrome.devtools.panels.themeName;
  const osDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  if (devtoolsScheme === 'dark' || osDarkScheme.matches) {
    callback('dark');
  }

  osDarkScheme.addEventListener('change', (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  });
}
