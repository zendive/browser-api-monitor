import { hashString } from '../api/hash.ts';
import { EWrapperCallstackType } from '../api/settings.ts';

export type TTrace = {
  name: string | 0;
  link: string;
};
export type TCallstack = {
  traceId: string;
  trace: TTrace[];
};
export enum ETraceDomain {
  SAME,
  EXTERNAL,
  EXTENSION,
  UNKNOWN,
}

export const REGEX_STACKTRACE_CLEAN_URL = /*@__PURE__*/ new RegExp(
  /(.*):\d+:\d+$/
);
export const REGEX_STACKTRACE_LINE_NUMBER = /*@__PURE__*/ new RegExp(
  /.*:(\d+):\d+$/
);
export const REGEX_STACKTRACE_COLUMN_NUMBER = /*@__PURE__*/ new RegExp(
  /.*:\d+:(\d+)$/
);
export const TAG_INVALID_CALLSTACK_LINK = '⟪N/A⟫';

const REGEX_STACKTRACE_SPLIT = /*@__PURE__*/ new RegExp(/\n\s+at\s/);
const REGEX_STACKTRACE_NAME = /*@__PURE__*/ new RegExp(/^(.+)\(.*/);
const REGEX_STACKTRACE_LINK = /*@__PURE__*/ new RegExp(/.*\((async )?(.*)\)$/);
const REGEX_STACKTRACE_LINK_PROTOCOL = /*@__PURE__*/ new RegExp(
  /http[s]?\:\/\//
);

export class TraceUtil {
  selfTraceLink = '';
  callstackType: EWrapperCallstackType = EWrapperCallstackType.FULL;
  trace4Debug: string | null = null;
  trace4Bypass: string | null = null;
  static readonly SIGNATURE = 'browser-api-monitor';

  constructor() {
    this.selfTraceLink = this.#getSelfTraceLink();
  }

  getCallstack(e: Error, uniqueTrait?: unknown): TCallstack {
    if (this.callstackType === EWrapperCallstackType.FULL) {
      return this.#getFullCallstack(e, uniqueTrait);
    } else {
      return this.#getShortCallstack(e, uniqueTrait);
    }
  }

  getTraceDomain(trace: TTrace) {
    if (trace.link.startsWith(location.origin)) {
      return ETraceDomain.SAME;
    } else if (REGEX_STACKTRACE_LINK_PROTOCOL.test(trace.link)) {
      return ETraceDomain.EXTERNAL;
    } else if (trace.link.startsWith('chrome-extension://')) {
      return ETraceDomain.EXTENSION;
    }

    return ETraceDomain.UNKNOWN;
  }

  shouldPass(traceId: string) {
    return this.trace4Bypass !== traceId;
  }

  shouldPause(traceId: string) {
    return this.trace4Debug === traceId;
  }

  #getSelfTraceLink() {
    const error = new Error(TraceUtil.SIGNATURE);
    return (error?.stack || '')
      .split(REGEX_STACKTRACE_SPLIT)[1]
      .replace(REGEX_STACKTRACE_LINK, '$2')
      .replace(REGEX_STACKTRACE_CLEAN_URL, '$1');
  }

  #getFullCallstack(e: Error, uniqueTrait?: unknown): TCallstack {
    const trace = this.#getFullTrace(e.stack || '');
    const traceId = e.stack || String(uniqueTrait);

    return {
      traceId: hashString(traceId),
      trace: trace || [this.#getInvalidTrace(uniqueTrait)],
    };
  }

  #getFullTrace(stackString: string): TTrace[] | null {
    const stack = stackString.split(REGEX_STACKTRACE_SPLIT) || [];
    const rv: TTrace[] = [];

    // loop from the end, excluding error name at [0] and self trace at [1|x]
    for (let n = stack.length - 1; n > 1; n--) {
      const parsed = this.#parseTraceRow(stack[n]);

      if (parsed) {
        rv.push(parsed);
      }
    }

    return rv.length ? rv : null;
  }

  #getShortCallstack(e: Error, uniqueTrait?: unknown): TCallstack {
    let trace = this.#getShortTrace(e.stack || '');
    let traceId;

    if (trace) {
      traceId = trace.link;
    } else {
      traceId = e.stack || String(uniqueTrait);
      trace = this.#getInvalidTrace(uniqueTrait);
    }

    return { traceId: hashString(traceId), trace: [trace] };
  }

  #getShortTrace(stackString: string): TTrace | null {
    const stack = stackString.split(REGEX_STACKTRACE_SPLIT) || [];

    // loop from the start, excluding error name at [0] and self trace at [1|x]
    for (let n = 2, N = stack.length; n < N; n++) {
      const parsed = this.#parseTraceRow(stack[n]);

      if (parsed) {
        return parsed;
      }
    }

    return null;
  }

  #parseTraceRow(stackRow: string) {
    if (stackRow.indexOf(this.selfTraceLink) >= 0) {
      return;
    }

    const link = stackRow.replace(REGEX_STACKTRACE_LINK, '$2').trim();
    if (link.indexOf('<anonymous>') >= 0) {
      return;
    }

    let name: string | 0 = stackRow.replace(REGEX_STACKTRACE_NAME, '$1').trim();
    if (name === link) {
      name = 0;
    }

    return { name, link };
  }

  #getInvalidTrace(uniqueTrait?: unknown): TTrace {
    return {
      name:
        typeof uniqueTrait === 'function' && uniqueTrait.name
          ? uniqueTrait.name
          : 0,
      link: TAG_INVALID_CALLSTACK_LINK,
    };
  }
}
