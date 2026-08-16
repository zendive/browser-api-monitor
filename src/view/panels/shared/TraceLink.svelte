<script lang="ts">
  import {
    REGEX_CUT_LINK_PROTOCOL,
    REGEX_STACKTRACE_CLEAN_URL,
    REGEX_STACKTRACE_COLUMN_NUMBER,
    REGEX_STACKTRACE_LINE_NUMBER,
    REGEX_STACKTRACE_LOCATION_URL,
    TAG_INVALID_CALLSTACK_LINK,
  } from '../../../wrapper/shared/Tracer.ts';

  let {
    name,
    link,
  }: {
    name: string | 0;
    link: string;
  } = $props();
  let visited: boolean = $state(false);
  let isSourceLess = $derived.by(() => TAG_INVALID_CALLSTACK_LINK === link);
  let linkFormatted = $derived.by(() => {
    if (isSourceLess) {
      return link;
    }

    try {
      const url = new URL(link);
      return url.pathname;
    } catch (_ignore) {
      return link.replace(REGEX_CUT_LINK_PROTOCOL, '');
    }
  });

  function showStackTraceResource() {
    const cleanUrl = link.replace(REGEX_STACKTRACE_CLEAN_URL, '$1');
    let line = 1, column = 1;

    if (REGEX_STACKTRACE_LOCATION_URL.test(link)) {
      line = parseInt(
        link.replace(REGEX_STACKTRACE_LINE_NUMBER, '$1'),
        10
      );
      column = parseInt(
        link.replace(REGEX_STACKTRACE_COLUMN_NUMBER, '$1'),
        10
      );
    }

    chrome?.devtools?.panels.openResource(
      cleanUrl,
      line - 1,
      column - 1,
      // @ts-expect-error: incomplete documentation for callback argument
      (acknowledge: IOpenResourceCallbackArgument) => {
        visited = !acknowledge.isError;
      },
    );
  }

  function onClick(e: MouseEvent) {
    e.preventDefault();
    showStackTraceResource();
  }
</script>

{#if isSourceLess}
  <i class="no-link">{name ? `${name} ${link}` : link}</i>
{:else}
  <a
    href={link}
    title={link}
    class="-trace"
    class:visited
    class:name={!!name}
    onclick={onClick}
  >
    {name || linkFormatted}
  </a>
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

    &.name {
      font-weight: 600;
    }
    &.visited {
      color: var(--attention);
    }
  }

  @media only screen and (width <= 45rem) {
    a {
      max-width: 15rem;
    }
  }
  @media only screen and (width <= 35rem) {
    a {
      max-width: 8rem;
    }
  }
  @media only screen and (width <= 27rem) {
    a {
      max-width: 4rem;
    }
  }
</style>
