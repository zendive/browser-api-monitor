import { describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import { Fact } from '../src/wrapper/Fact.ts';

const fact_1 = Fact.define(0b0001);
const fact_2 = Fact.define(0b0010);

describe('Facts', () => {
  test('define', () => {
    expect(() => {
      Fact.define(-1);
    }).toThrow(/Number.MAX_SAFE_INTEGER/);

    expect(() => {
      Fact.define(Number.MAX_SAFE_INTEGER + 1);
    }).toThrow(/Number.MAX_SAFE_INTEGER/);
  });

  test('assign/check', () => {
    let data = 0;

    data = Fact.assign(data, fact_1);
    expect(Fact.check(data, fact_1)).toBeTruthy();
    expect(data).toBe(0b0001);

    data = Fact.assign(data, fact_2);
    expect(Fact.check(data, fact_2)).toBeTruthy();
    expect(data).toBe(0b0011);
  });

  test('getDetails', () => {
    let data = 0;
    const factsMap = new Map([
      [fact_1, { tag: '1', details: 'fact_1' }],
      [fact_2, { tag: '2', details: 'fact_2' }],
    ]);

    for (const [fact, _detail] of factsMap) {
      data = Fact.assign(data, fact);
    }

    const details = Fact.getDetails(factsMap);

    expect(details).toBe(`1: fact_1\n2: fact_2`);
  });
});
