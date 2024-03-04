<script lang="ts">
  import {
    REGEX_STACKTRACE_CLEAN_URL,
    REGEX_STACKTRACE_COLUMN_NUMBER,
    REGEX_STACKTRACE_LINE_NUMBER,
  } from '@/api/const';

  export let href: string = '';
  export let name: string = '';
  let beenClicked = false;

  $: lineNumber = parseInt(
    href?.replace(REGEX_STACKTRACE_LINE_NUMBER, '$1'),
    10
  );
  $: columnNumber = parseInt(
    href.replace(REGEX_STACKTRACE_COLUMN_NUMBER, '$1'),
    10
  );
  $: isSourceLess = !isFinite(lineNumber) || href.startsWith('<anonymous>');

  function showStackTraceResource(e: MouseEvent) {
    e.preventDefault();

    const cleanUrl = href.replace(REGEX_STACKTRACE_CLEAN_URL, '$1');

    chrome.devtools.panels.openResource(
      cleanUrl,
      lineNumber - 1,
      columnNumber - 1
    );

    beenClicked = true;
  }
</script>

{#if isSourceLess}
  <span>{`${name} ${href === name ? '' : href}`}</span>
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
    color: var(--link);

    &.beenClicked {
      background-color: var(--link-bg-visited);
    }
  }
</style>
