# <img src="./public/img/icon.svg" width="32"/> API Monitor - Chrome Developer Tools extension

- Available in Chrome Web Store as [API Monitor](https://chromewebstore.google.com/detail/api-monitor/bghmfoakiidiedpheejcjhciekobjcjp)

Chrome Developer Tools `API 🔎` panel tries to gather every bit of useful information from the usage of certain native functions that are prone to human errors, or are difficult to spot intuitively.

#### Motivation

To assess Web Application implementation correctness and expedite issues discovery. [See examples](./doc/issues.log.md).

#### Functionality
 
- Gather callstack that is used to call every wrapped function:
  - **short** - just the nearest initiator.
  - **full** - from the root to the nearest initiator (from left to right).

- Aggregate information about currently scheduled timeouts and running active intervals.

- Gather details about which terminators are cancelling certain scheduled setters.

- Allow to initiate a debugging session by redirecting the code flow to a `debugger` breakpoint right before the callback invocation.
  - Hit <kbd>F11</kbd> (step inside) **twice** in order to progress into the callback itself.

- Allow to bypass (skip) setter's callback, or terminator invocation function.

- Detect anomalies in passed arguments such as:
  - Passing incorrect timeout delay to `setTimeout`, `setInterval`, `requestIdleCallback`.
    - Correct one is `undefined` or a number that is greater or equal to `0`.
  - Invoking terminator function with handler that is non-positive integer, or of non-existent or already elapsed setter.

- Measure callback's execution self-time.
  - Warn if it exceeds 4/5 (13.33ms) of 60 FPS hardcoded frame-rate (16.66ms).

- Count calls per second (CPS) when applicable.
  - If requested recursively - it reflects animation FPS.

- Detect `eval` function usage in runtime, as well as `setTimeout` and `setInterval` when called with a `string` callback instead of a `function`.
  - By default - `off`, cause the fact of wrapping it, excludes the access to local scope variables from the `eval` script, and as a result, may break the application if it does depend on it.

- Monitor Worker's methods and event handlers metrics.
  - Warn if number of active workers exceeds number of available CPU cores.
    - keep in mind: extension API can't wrap `self.close()` in worker global context (only `terminate()` in top context)
  - Detect anomalies:
    - attempt to add already added listener with `addEventListener`.
    - attempt to remove unknown listener with `removeEventListener`.

- Monitor `scheduler.yield` and `scheduler.postTask`.
  - Calls, delay, priority, aborts, self-time metrics.

- Monitor mounted `video` and `audio` media elements in DOM.
  - Present control panel with basic media functions.
  - Show media events and number of times they have been fired.
  - Show current state of properties.
  - Allow to toggle the state of changeable boolean properties e.g. `controls`, `preservesPitch`...
  
- Prevent the system from going to Sleep state due to user inactivity for a better observational experience. By default - `off`.

<details>
  <summary> <strong>Wrappable native functions</strong> </summary>

- `eval`
- `setTimeout`
  - `clearTimeout`
- `setInterval`
  - `clearInterval`
- `requestAnimationFrame`
  - `cancelAnimationFrame`
- `requestIdleCallback`
  - `cancelIdleCallback`
- `Worker`
  - `constructor`
  - `terminate`
  - `onmessage`
  - `onerror`
  - `postMessage`
  - `addEventListener`
  - `removeEventListener`
- `scheduler`
  - `postTask`
  - `yield`

</details>
<details>
  <summary> <strong>Screenshots</strong> </summary>

![screenshot](./doc/screenshot-01.png)
![screenshot](./doc/screenshot-02.png)
![screenshot](./doc/screenshot-03.png)
![screenshot](./doc/screenshot-04.png)

</details>

> [!NOTE]
> While measuring performance of your code – consider disabling this extension as it may affect the results.

### Build requirements

- OS: Linux
- Node: 22.14.0 (LTS)
- [Deno](https://docs.deno.com/runtime/getting_started/installation/) 2.4.2

### Build instructions

```bash
make install  # install dependencies
make dev      # build in development mode and watch for changes
make prod     # build in production mode and make extension.chrome.zip
```
