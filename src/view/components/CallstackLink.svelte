<script lang="ts">
  import {
    REGEX_STACKTRACE_CLEAN_URL,
    REGEX_STACKTRACE_COLUMN_NUMBER,
    REGEX_STACKTRACE_LINE_NUMBER,
  } from '@/api/const';

  export let href = '';
  export let name = '';
  let beenClicked = false;

  $: lineNumber = parseInt(
    href?.replace(REGEX_STACKTRACE_LINE_NUMBER, '$1'),
    10
  );
  $: columnNumber = parseInt(
    href.replace(REGEX_STACKTRACE_COLUMN_NUMBER, '$1'),
    10
  );
  $: hasError = !isFinite(lineNumber);

  function showStackTraceResource(e: MouseEvent) {
    e.preventDefault();
    if (hasError) {
      return;
    }

    const cleanUrl = href.replace(REGEX_STACKTRACE_CLEAN_URL, '$1');

    chrome.devtools.panels.openResource(
      cleanUrl,
      lineNumber - 1,
      columnNumber - 1
    );

    beenClicked = true;
  }
</script>

{#if hasError}
  <span>{name} {href}</span>
{:else}
  <a
    {href}
    title={`${lineNumber}:${columnNumber}`}
    class:beenClicked
    on:click={showStackTraceResource}>{name}</a
  >
{/if}

<style lang="scss">
  a {
    word-break: break-all;

    &.beenClicked {
      background-color: rgb(247 184 0 / 50%);
    }
  }
</style>
