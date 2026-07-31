import { hashString } from '../../api/hash.ts';

export enum EWrapperCallstackType {
  FULL,
  SHORT,
}

export interface ITrace {
  name: string | 0;
  link: string;
}
export interface ICallstack {
  traceId: string;
  trace: ITrace[];
}
export interface ITraceable {
  traceId: string;
  trace: ITrace[];
  firstSeen: number;
}

export const REGEX_STACKTRACE_CLEAN_URL = /*@__PURE__*/ new RegExp(
  /(.*):\d+:\d+$/,
);
export const REGEX_STACKTRACE_LINE_NUMBER = /*@__PURE__*/ new RegExp(
  /.*:(\d+):\d+$/,
);
export const REGEX_STACKTRACE_COLUMN_NUMBER = /*@__PURE__*/ new RegExp(
  /.*:\d+:(\d+)$/,
);
export const REGEX_CUT_LINK_PROTOCOL = /*@__PURE__*/ new RegExp(
  /^[a-z\-]+:\/+/i,
);
export const TAG_INVALID_CALLSTACK_LINK = '⟪N/A⟫';

const REGEX_STACKTRACE_SPLIT = /*@__PURE__*/ new RegExp(/\n\s*at\s+/);

export class TraceUtil {
  selfTraceLink = 'chrome-extension://bghmfoakiidiedpheejcjhciekobjcjp';
  callstackType: EWrapperCallstackType = EWrapperCallstackType.FULL;
  debug: Set<string> = new Set();
  bypass: Set<string> = new Set();
  static readonly SIGNATURE = 'browser-api-monitor';

  getCallstack(e: Error, uniqueTrait?: unknown): ICallstack {
    if (this.callstackType === EWrapperCallstackType.FULL) {
      return this.#getFullCallstack(e, uniqueTrait);
    } else {
      return this.#getShortCallstack(e, uniqueTrait);
    }
  }

  shouldPass(traceId: string) {
    return !this.bypass.has(traceId);
  }

  shouldPause(traceId: string) {
    return this.debug.has(traceId);
  }

  #getFullCallstack(e: Error, uniqueTrait?: unknown): ICallstack {
    const stack = e.stack ?? '';
    const trace = this.#getFullTrace(stack) ||
      this.#getFallbackTrace(uniqueTrait);
    const traceId = hashString(trace.map((o) => o.link).join(';'));

    return { traceId, trace };
  }

  #getFullTrace(stackString: string): ITrace[] | null {
    const stack = stackString.split(REGEX_STACKTRACE_SPLIT) || [];
    const rv: ITrace[] = [];

    // loop from the end, excluding error name at [0] and self trace at [1]
    for (let n = stack.length - 1; n > 1; n--) {
      const parsed = this.#parseTraceRow(stack[n]);

      if (parsed) {
        rv.push(parsed);
      }
    }

    return rv.length ? rv : null;
  }

  #getShortCallstack(e: Error, uniqueTrait?: unknown): ICallstack {
    let traceId: string;
    let trace = this.#getShortTrace(e.stack || '');

    if (trace && trace[0]) {
      traceId = hashString(trace[0].link);
    } else {
      traceId = hashString(e.stack || String(uniqueTrait));
      trace = this.#getFallbackTrace(uniqueTrait);
    }

    return { traceId, trace };
  }

  #getShortTrace(stackString: string): ITrace[] | null {
    const stack = stackString.split(REGEX_STACKTRACE_SPLIT) || [];

    // loop from the start, excluding error name at [0] and self trace at [1]
    for (let n = 2, N = stack.length; n < N; n++) {
      const parsed = this.#parseTraceRow(stack[n]);

      if (parsed) {
        return [parsed];
      }
    }

    return null;
  }

  #parseTraceRow(row: string): ITrace | null {
    if (row.indexOf(this.selfTraceLink) >= 0) {
      return null;
    }

    let name: ITrace['name'] = 0;
    let link: ITrace['link'];
    const preOpenParenIndex = row.indexOf(' (');
    const hasClosingParen = row.endsWith(')');

    if (preOpenParenIndex > 0 && hasClosingParen) {
      name = row.substring(0, preOpenParenIndex);
      link = row.substring(preOpenParenIndex + 2, row.length - 1);
    } else if (row.startsWith('(') && hasClosingParen) {
      link = row.substring(1, row.length - 1);
    } else {
      link = row;
    }

    if (link.startsWith('eval at ')) {
      const commaIndex = link.lastIndexOf(', ');

      if (commaIndex > 0) {
        link = link.substring(commaIndex + 2);
      } else {
        return null;
      }
    }

    if (link.startsWith('async ')) {
      link = link.substring(6);
    }

    if (link.startsWith('new ')) {
      link = link.substring(4);
    }

    if (
      !link ||
      link.startsWith('<anonymous>') ||
      link.startsWith('index ') ||
      link.startsWith('native')
    ) {
      return null;
    }

    return { name, link };
  }

  #getFallbackTrace(uniqueTrait?: unknown): ITrace[] {
    return [{
      name: typeof uniqueTrait === 'function' && uniqueTrait.name
        ? uniqueTrait.name
        : 0,
      link: TAG_INVALID_CALLSTACK_LINK,
    }];
  }
}
