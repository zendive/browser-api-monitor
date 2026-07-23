import { describe, expect, test } from 'vitest';
import {
  EWrapperCallstackType,
  TAG_INVALID_CALLSTACK_LINK,
  TraceUtil,
} from '../src/wrapper/shared/TraceUtil.ts';

describe('TraceUtil', () => {
  const traceUtil = new TraceUtil();
  const TEST_STACK = `Error: ${TraceUtil.SIGNATURE}
    at self (${traceUtil.selfTraceLink}:77:19)
    at async (<anonymous>:1:1)
    at call2 (async https://example2.com/bundle3.js:4:5)
    at call1 (https://example1.com/bundle2.js:3:4)
    at async https://example1.com/bundle2.js:2:3
    at self (${traceUtil.selfTraceLink}:77:19)`;
  const TEST_STACK_SHORT_HASH = 'https://example2.com/bundle3.js:4:5';
  const HASH_REGEX = /^[a-f0-9]{64}$/i;
  const TEST_MISSING_STACK = `Error: ${TraceUtil.SIGNATURE}
    at self (${traceUtil.selfTraceLink}:77:19)
    at async (<anonymous>:1:1)
    at self (${traceUtil.selfTraceLink}:77:19)`;

  test('createCallstack full', () => {
    traceUtil.callstackType = EWrapperCallstackType.FULL;
    const { traceId, trace } = traceUtil.getCallstack(
      <Error> { stack: TEST_STACK },
      null,
    );
    const expected = [
      { name: 0, link: 'https://example1.com/bundle2.js:2:3' },
      { name: 'call1', link: 'https://example1.com/bundle2.js:3:4' },
      { name: 'call2', link: 'https://example2.com/bundle3.js:4:5' },
    ];

    expect(traceId).toMatch(HASH_REGEX);
    expect(trace).toEqual(expected);
  });

  test('createCallstack short', () => {
    traceUtil.callstackType = EWrapperCallstackType.SHORT;
    const { traceId, trace } = traceUtil.getCallstack(
      <Error> { stack: TEST_STACK },
      null,
    );
    const expected = [
      { name: 'call2', link: 'https://example2.com/bundle3.js:4:5' },
    ];

    expect(traceId).toBe(TEST_STACK_SHORT_HASH);
    expect(trace).toEqual(expected);
  });

  test('missing link - use trait', () => {
    function functionTrace() {}
    traceUtil.callstackType = EWrapperCallstackType.SHORT;
    const { traceId, trace } = traceUtil.getCallstack(
      <Error> { stack: TEST_MISSING_STACK },
      functionTrace,
    );
    const expected = [
      { name: functionTrace.name, link: TAG_INVALID_CALLSTACK_LINK },
    ];

    expect(traceId).toMatch(HASH_REGEX);
    expect(trace).toEqual(expected);
  });
});
