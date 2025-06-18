> [!NOTE]
> The content provided is for educational and informational purpose only. Websites, dates, names are not mentioned on purpose.

### Issues, that could have been spotted during the development

- A ~10ms delay interval, from an old third-party library, constantly consuming approximately 10% of CPU solely to check if the window was resized.

- A bundled dependency library that utilizes the `eval` function, thereby preventing the removal of `unsafe-eval` from the `Content-Security-Policy`  header.

  - Code that uses `eval` with modern syntax to check if it's supported by browser (not throws exception).

  - Dependency package that was bundled with webpack's config option [`devtool: 'eval'`](https://webpack.js.org/configuration/devtool/) or [`mode: 'development'`](https://webpack.js.org/configuration/mode/).

- A substantial number of hidden video elements in DOM stopped working, after Chrome unexpectedly limited them to 100 per domain (later the limit was lifted to 1000).

- Redundant duplicate `video` element, hidden under the actual video on a landing-page.

- `setTimeout`, `setInterval` are used to animate instead of `requestAnimationFrame`.

- `setTimeout` with dynamically computed delay value ends to be called with `NaN`.

- Hidden UI feature runs its logic in the background.

  - Indirectly, discovered from the bursts of short timeouts, fired from `ResizeObserver` handler of invisible feature that appears to be: or for a power user only, or just partially deprecated.

  - Animation still runs (plus network requests) in the background after a "paywall" fullscreen popup. Despite claiming "it's to conserve data bandwidth". CPU usage doesn't drop to 0%.
