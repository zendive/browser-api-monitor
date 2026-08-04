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

export const REGEX_STACKTRACE_LOCATION_URL = /*@__PURE__*/ new RegExp(
  /.+:\d+:\d+$/,
);
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
export const TRACER_SELF_LINK =
  'chrome-extension://bghmfoakiidiedpheejcjhciekobjcjp';
const REGEX_STACKTRACE_SPLIT = /*@__PURE__*/ new RegExp(/\n\s*at\s+/);

export class Tracer {
  static callstackType: EWrapperCallstackType = EWrapperCallstackType.FULL;
  // @note: browser's default limit is 10, here 11 to compensate for self-trace row
  static stackTraceLimit: number = 11;
  static debug: Set<string> = new Set();
  static bypass: Set<string> = new Set();

  /**
   * @param [uniqueTrait]: optional function to use in fallback scenarios
   * @param [customStack]: optional stack string to use instead of capturing current one
   */
  static getCallstack(uniqueTrait?: unknown, customStack?: string): ICallstack {
    let stack: string;

    if (customStack && typeof customStack === 'string') {
      stack = customStack;
    } else {
      const authoredLimit = Error.stackTraceLimit;
      const envelop = { stack: '' };

      Error.stackTraceLimit = Tracer.stackTraceLimit;
      Error.captureStackTrace(envelop, Tracer.getCallstack);
      Error.stackTraceLimit = authoredLimit;

      stack = envelop.stack;
    }

    let callstack: ICallstack;

    if (Tracer.callstackType === EWrapperCallstackType.FULL) {
      callstack = getFullCallstack(uniqueTrait, stack);
    } else {
      callstack = getShortCallstack(uniqueTrait, stack);
    }

    return callstack;
  }

  static shouldPass(traceId: string) {
    return !Tracer.bypass.has(traceId);
  }

  static shouldPause(traceId: string) {
    return Tracer.debug.has(traceId);
  }
}

function getFullCallstack(uniqueTrait: unknown, stack: string): ICallstack {
  const trace = getFullTrace(stack) || getFallbackTrace(uniqueTrait);
  const traceId = hashString(trace.map((o) => o.link).join(';'));

  return { traceId, trace };
}

function getFullTrace(stack: string): ITrace[] | null {
  const rows = (stack || '').split(REGEX_STACKTRACE_SPLIT) || [];
  const rv: ITrace[] = [];

  // loop from the end, excluding error name at [0] and self trace at [1]
  for (let n = rows.length - 1; n > 1; n--) {
    const parsed = parseTraceRow(rows[n]);

    if (parsed) {
      rv.push(parsed);
    }
  }

  return rv.length ? rv : null;
}

function getShortCallstack(uniqueTrait: unknown, stack: string): ICallstack {
  const rows = stack.split(REGEX_STACKTRACE_SPLIT) || [];
  let traceId: string;
  let trace: ITrace[] | null = getShortTrace(rows);

  if (trace && trace[0]) {
    traceId = hashString(trace[0].link);
  } else {
    traceId = hashString(stack || String(uniqueTrait));
    trace = getFallbackTrace(uniqueTrait);
  }

  return { traceId, trace };
}

function getShortTrace(rows: string[]): ITrace[] | null {
  // loop from the start, excluding error name at [0] and self trace at [1]
  for (let n = 2, N = rows.length; n < N; n++) {
    const parsed = parseTraceRow(rows[n]);

    if (parsed) {
      return [parsed];
    }
  }

  return null;
}

function parseTraceRow(row: string): ITrace | null {
  if (row.indexOf(TRACER_SELF_LINK) >= 0) {
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

function getFallbackTrace(uniqueTrait?: unknown): ITrace[] {
  return [{
    name: typeof uniqueTrait === 'function' && uniqueTrait.name
      ? uniqueTrait.name
      : 0,
    link: TAG_INVALID_CALLSTACK_LINK,
  }];
}
