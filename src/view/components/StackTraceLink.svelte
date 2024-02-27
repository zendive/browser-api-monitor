<script lang="ts">
  import {
    REGEX_STACKTRACE_CLEAN_URL,
    REGEX_STACKTRACE_COLUMN_NUMBER,
    REGEX_STACKTRACE_LINE_NUMBER,
  } from '@/api/const';

  export let href = '';
  export let name = '';

  $: lineNumber = parseInt(
    href?.replace(REGEX_STACKTRACE_LINE_NUMBER, '$1'),
    10
  );
  $: columnNumber = parseInt(
    href.replace(REGEX_STACKTRACE_COLUMN_NUMBER, '$1'),
    10
  );

  function showStackTraceResource(e: MouseEvent) {
    e.preventDefault();

    const cleanUrl = href.replace(REGEX_STACKTRACE_CLEAN_URL, '$1');

    chrome.devtools.panels.openResource(cleanUrl, lineNumber, columnNumber);
  }
</script>

<a
  {href}
  title={`${lineNumber}:${columnNumber}`}
  on:click={showStackTraceResource}>{name}</a
>
