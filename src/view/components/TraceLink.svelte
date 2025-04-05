<script lang="ts">
  import {
    REGEX_STACKTRACE_CLEAN_URL,
    REGEX_STACKTRACE_COLUMN_NUMBER,
    REGEX_STACKTRACE_LINE_NUMBER,
    TAG_INVALID_CALLSTACK_LINK,
  } from '../../wrapper/TraceUtil.ts';

  let {
    name,
    link = '',
  }: {
    name: string | 0;
    link?: string;
  } = $props();
  let visited: boolean = $state(false);
  let lineNumber = $derived.by(() =>
    parseInt(link?.replace(REGEX_STACKTRACE_LINE_NUMBER, '$1'), 10)
  );
  let isSourceLess = $derived.by(
    () =>
      !Number.isFinite(lineNumber) || TAG_INVALID_CALLSTACK_LINK === link,
  );

  function showStackTraceResource() {
    const cleanUrl = link.replace(REGEX_STACKTRACE_CLEAN_URL, '$1');
    const columnNumber = parseInt(
      link.replace(REGEX_STACKTRACE_COLUMN_NUMBER, '$1'),
      10,
    );

    chrome.devtools.panels.openResource(
      cleanUrl,
      lineNumber - 1,
      columnNumber - 1,
    );

    visited = true;
  }

  function onClick(e: MouseEvent) {
    e.preventDefault();
    showStackTraceResource();
  }
</script>

{#if isSourceLess}
  <i class="no-link">{name ? `${name} ${link}` : link}</i>
{:else}
  <a href={link} class="-trace" class:visited onclick={onClick}>{
    name || link
  }</a>
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

    &.visited {
      background-color: var(--link-visited-bg);
    }
  }

  @media only screen and (max-width: 45rem) {
    a {
      max-width: 15rem;
    }
  }
  @media only screen and (max-width: 35rem) {
    a {
      max-width: 8rem;
    }
  }
  @media only screen and (max-width: 27rem) {
    a {
      max-width: 4rem;
    }
  }
</style>
