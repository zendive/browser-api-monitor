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
    at call4 (async https://example.com/bundle.js:13:21)
    at call3 (https://example.com/bundle.js:5:8)
    at call2 (data:text/javascript,let it = 'be';:2:3)
    at async https://example.com/bundle.js:1:1
    at self (${traceUtil.selfTraceLink}:77:19)`;
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
      { name: 0, link: 'https://example.com/bundle.js:1:1' },
      { name: 'call2', link: `data:text/javascript,let it = 'be';:2:3` },
      { name: 'call3', link: 'https://example.com/bundle.js:5:8' },
      { name: 'call4', link: 'https://example.com/bundle.js:13:21' },
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
      { name: 'call4', link: 'https://example.com/bundle.js:13:21' },
    ];

    expect(traceId).toBe(expected[0].link);
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
