import type { Brand } from '../api/generics.ts';

type TFact = Brand<number, 'TFact'>;
type TFactDetail = string;
type TFactsMap = Map<TFact, TFactDetail>;

export class Fact {
  /**
   * @param(n): 53 bits number in range [0 ... Number.MAX_SAFE_INTEGER]
   */
  static define(n: number): TFact {
    if (Number.isInteger(n) && 0 < n && n <= Number.MAX_SAFE_INTEGER) {
      return n as TFact;
    } else {
      throw new Error('Fact must be in range [0 .. Number.MAX_SAFE_INTEGER]');
    }
  }

  static assign(data: number, fact: TFact): TFact {
    return (data | fact) as TFact;
  }

  static check(data: number, fact: TFact): TFact {
    return (data & fact) as TFact;
  }

  static getDetails(data: number, factsMap: TFactsMap): TFactDetail[] {
    const rv = [];

    for (const [fact, detail] of factsMap) {
      Fact.check(data, fact) && rv.push(detail);
    }

    return rv;
  }
}
