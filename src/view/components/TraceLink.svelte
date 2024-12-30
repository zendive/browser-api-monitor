<script lang="ts">
  import {
    REGEX_STACKTRACE_CLEAN_URL,
    REGEX_STACKTRACE_COLUMN_NUMBER,
    REGEX_STACKTRACE_LINE_NUMBER,
    TAG_INVALID_CALLSTACK_LINK,
  } from '../../api/const.ts';

  export let link: string = '';
  export let name;
  let isSeen = false;

  $: lineNumber = parseInt(
    link?.replace(REGEX_STACKTRACE_LINE_NUMBER, '$1'),
    10
  );
  $: isSourceLess =
    !isFinite(lineNumber) || TAG_INVALID_CALLSTACK_LINK === link;

  function showStackTraceResource() {
    const cleanUrl = link.replace(REGEX_STACKTRACE_CLEAN_URL, '$1');
    const columnNumber = parseInt(
      link.replace(REGEX_STACKTRACE_COLUMN_NUMBER, '$1'),
      10
    );

    chrome.devtools.panels.openResource(
      cleanUrl,
      lineNumber - 1,
      columnNumber - 1
    );

    isSeen = true;
  }
</script>

{#if isSourceLess}
  <i class="no-link">
    {name ? `${name} ${link}` : link}
  </i>
{:else}
  <a
    href={link}
    class="-trace"
    class:isSeen
    on:click|preventDefault={showStackTraceResource}>{name || link}</a
  >
{/if}

<style lang="scss">
  .no-link,
  a {
    display: inline-block;
    vertical-align: text-bottom;
    color: var(--link);
  }

  a {
    word-break: break-all;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 25rem;

    &.isSeen {
      color: var(--link-visited-text);
      background-color: var(--link-visited-bg);
    }
  }
</style>
