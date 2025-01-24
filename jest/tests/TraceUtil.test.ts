import { EWrapperCallstackType } from '../../src/api/settings.ts';
import {
  TAG_INVALID_CALLSTACK_LINK,
  TraceUtil,
} from '../../src/wrapper/TraceUtil.ts';
import { describe, expect, test } from '@jest/globals';
import { TextEncoder } from 'node:util';

global.TextEncoder = TextEncoder;

const TEST_STACK = `Error: ${TraceUtil.SIGNATURE}
        at <anonymous>:1:1
        at async (<anonymous>:1:1)
        at call2 (async https://example2.com/bundle3.js:4:5)
        at call1 (https://example1.com/bundle2.js:3:4)`;
const TEST_MISSING_STACK = `Error: ${TraceUtil.SIGNATURE}
        at <anonymous>:1:1
        at async (<anonymous>:1:1)`;

describe('TraceUtil', () => {
  let traceUtil = new TraceUtil();

  test('createCallstack full', () => {
    traceUtil.callstackType = EWrapperCallstackType.FULL;
    const standard = [
      { name: 'call1', link: 'https://example1.com/bundle2.js:3:4' },
      { name: 'call2', link: 'https://example2.com/bundle3.js:4:5' },
    ];
    const { trace } = traceUtil.createCallstack(
      <Error>{ stack: TEST_STACK },
      null
    );

    expect(trace.length).toBe(2);
    expect(trace[0].name).toBe(standard[0].name);
    expect(trace[0].link).toBe(standard[0].link);
    expect(trace[1].name).toBe(standard[1].name);
    expect(trace[1].link).toBe(standard[1].link);
  });

  test('createCallstack short', () => {
    traceUtil.callstackType = EWrapperCallstackType.SHORT;
    const standard = [
      { name: 'call2', link: 'https://example2.com/bundle3.js:4:5' },
    ];
    const { trace } = traceUtil.createCallstack(
      <Error>{ stack: TEST_STACK },
      null
    );

    expect(trace.length).toBe(1);
    expect(trace[0].name).toBe(standard[0].name);
    expect(trace[0].link).toBe(standard[0].link);
  });

  test('missing link - use trait', () => {
    function functionTrace() {}
    const standard = [
      { name: functionTrace.name, link: TAG_INVALID_CALLSTACK_LINK },
    ];
    traceUtil.callstackType = EWrapperCallstackType.SHORT;
    const { trace } = traceUtil.createCallstack(
      <Error>{ stack: TEST_MISSING_STACK },
      functionTrace
    );

    expect(trace[0].name).toBe(standard[0].name);
    expect(trace[0].link).toBe(standard[0].link);
  });
});
