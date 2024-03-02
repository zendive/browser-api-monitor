🚧 work in progress - things may broke 🚧

# <img src="./public/img/icon.svg" width="26"/> Browser API Monitor

Wherether you developing SPA or curious how something works, this tool adds advanced functionality to chrome browser devtools to track time delayed invocations, show media elements state and events ([documentation](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement), [example](https://www.w3.org/2010/05/video/mediaevents.html)), detect and track usages of `eval`.

### Motivation

To expedite issues discovery, here are some examples from experience:

- ~10ms delay interval eating ~10% of CPU comming from a 3rd party library
- bundled dependency library that uses `eval` function
- huge chunk of hidden video elements in the DOM that were shortening suddenly limited resources of 100 medias per domain
- an unatended interval that was unintentionally left running and attributed to a slowly growing memory

To explore complex systems and to continue to push boundaries of imagination

### Build requirements

- OS: Linux
- Node: 20.11.1 (LTS)

### Build instructions

```bash
make install  # install dependencies
make dev      # build for development and recompile the changes
make prod     # build in production mode
make all      # make all in production mode and extension.zip for publishing
```
