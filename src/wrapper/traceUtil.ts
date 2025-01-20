import { hashString } from '../api/hash.ts';
import { EWrapperCallstackType } from '../api/settings.ts';

export const TRACE_ERROR_MESSAGE = 'browser-api-monitor';
export const REGEX_STACKTRACE_SPLIT = /*@__PURE__*/ new RegExp(/\n\s+at\s/);
export const REGEX_STACKTRACE_NAME = /*@__PURE__*/ new RegExp(/^(.+)\(.*/);
export const REGEX_STACKTRACE_LINK = /*@__PURE__*/ new RegExp(
  /.*\((async )?(.*)\)$/
);
export const REGEX_STACKTRACE_CLEAN_URL = /*@__PURE__*/ new RegExp(
  /(.*):\d+:\d+$/
);
export const REGEX_STACKTRACE_LINE_NUMBER = /*@__PURE__*/ new RegExp(
  /.*:(\d+):\d+$/
);
export const REGEX_STACKTRACE_COLUMN_NUMBER = /*@__PURE__*/ new RegExp(
  /.*:\d+:(\d+)$/
);
export const REGEX_STACKTRACE_LINK_PROTOCOL = /*@__PURE__*/ new RegExp(
  /http[s]?\:\/\//
);
export const TAG_INVALID_CALLSTACK_LINK = '⟪N/A⟫';
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

export class TraceUtil {
  selfTraceLink = '';
  callstackType: EWrapperCallstackType = EWrapperCallstackType.FULL;
  trace4Debug: string | null = null;
  trace4Bypass: string | null = null;

  constructor() {
    this.#initSelfTrace();
  }

  #initSelfTrace() {
    const error = new Error(TRACE_ERROR_MESSAGE);
    this.selfTraceLink = (error?.stack || '')
      .split(REGEX_STACKTRACE_SPLIT)[1]
      .replace(REGEX_STACKTRACE_LINK, '$2')
      .replace(REGEX_STACKTRACE_CLEAN_URL, '$1');
  }

  shouldDebug(traceId: string) {
    return this.trace4Debug === traceId;
  }

  shouldBypass(traceId: string) {
    return this.trace4Bypass === traceId;
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

  createCallstack(e: Error, uniqueTrait?: unknown): TCallstack {
    if (this.callstackType === EWrapperCallstackType.FULL) {
      return this.#createFullCallstack(e, uniqueTrait);
    } else {
      return this.#createShortCallstack(e, uniqueTrait);
    }
  }

  #createShortCallstack(e: Error, uniqueTrait?: unknown): TCallstack {
    let traceId = e.stack || String(uniqueTrait);
    const trace = this.#stack2traceArray(e.stack || '');

    if (trace.length) {
      trace.splice(0, trace.length - 1); // pick last one
      traceId = trace[0].link;
    } else {
      trace.push(this.#createInvalidTrace(uniqueTrait));
    }

    return { traceId: hashString(traceId), trace };
  }

  #createFullCallstack(e: Error, uniqueTrait?: unknown): TCallstack {
    const traceId = e.stack || String(uniqueTrait);
    const trace = this.#stack2traceArray(e.stack || '');

    if (!trace.length) {
      trace.push(this.#createInvalidTrace(uniqueTrait));
    }

    return { traceId: hashString(traceId), trace };
  }

  #stack2traceArray(stackString: string): TTrace[] {
    const stack = stackString.split(REGEX_STACKTRACE_SPLIT) || [];
    const rv: TTrace[] = [];

    // loop from the end, excluding error name and self trace
    for (let n = stack.length - 1; n > 1; n--) {
      let v = stack[n];

      if (v.indexOf(this.selfTraceLink) >= 0) {
        continue;
      }

      const link = v.replace(REGEX_STACKTRACE_LINK, '$2').trim();

      if (link.indexOf('<anonymous>') >= 0) {
        continue;
      }

      const name = v.replace(REGEX_STACKTRACE_NAME, '$1').trim();

      rv.push({ name: name === link ? 0 : name, link });
    }

    return rv;
  }

  #createInvalidTrace(uniqueTrait?: unknown): TTrace {
    let name: TTrace['name'] = 0;

    if (typeof uniqueTrait === 'function' && uniqueTrait.name) {
      name = uniqueTrait.name;
    }

    return {
      name,
      link: TAG_INVALID_CALLSTACK_LINK,
    };
  }
}
