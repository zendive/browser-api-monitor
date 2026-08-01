import { describe, expect, test } from 'vitest';
import {
  EWrapperCallstackType,
  TAG_INVALID_CALLSTACK_LINK,
  Tracer,
} from '../src/wrapper/shared/Tracer.ts';

describe('Tracer', () => {
  const TEST_STACK = `Error
    at self (${Tracer.selfTraceLink}:77:19)
    at async (<anonymous>:1:1)
    at call4 (async https://example.com/bundle.js:13:21)
    at call3 (https://example.com/bundle.js:5:8)
    at call2 (data:text/javascript,let it = 'be';:2:3)
    at async https://example.com/bundle.js:1:1
    at self (${Tracer.selfTraceLink}:77:19)`;
  const HASH_REGEX = /^[a-f0-9]{64}$/i;
  const TEST_MISSING_STACK = `Error
    at self (${Tracer.selfTraceLink}:77:19)
    at async (<anonymous>:1:1)
    at self (${Tracer.selfTraceLink}:77:19)`;

  test('createCallstack full', () => {
    Tracer.callstackType = EWrapperCallstackType.FULL;
    const { traceId, trace } = new Tracer(TEST_STACK).getCallstack();
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
    Tracer.callstackType = EWrapperCallstackType.SHORT;
    const { traceId, trace } = new Tracer(TEST_STACK).getCallstack();
    const expected = [
      { name: 'call4', link: 'https://example.com/bundle.js:13:21' },
    ];

    expect(traceId).toBe(expected[0].link);
    expect(trace).toEqual(expected);
  });

  test('missing link - use trait', () => {
    function functionTrace() {}
    Tracer.callstackType = EWrapperCallstackType.SHORT;
    const { traceId, trace } = new Tracer(TEST_MISSING_STACK).getCallstack(
      functionTrace,
    );
    const expected = [
      { name: functionTrace.name, link: TAG_INVALID_CALLSTACK_LINK },
    ];

    expect(traceId).toMatch(HASH_REGEX);
    expect(trace).toEqual(expected);
  });
});
