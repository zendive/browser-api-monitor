import type { Brand } from '../api/generics.ts';

export type TFact = Brand<number, 'TFact'>;
interface IFactDescriptor {
  tag: string;
  details: string;
}
export type TFactsMap = Map<TFact, IFactDescriptor>;

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

  static check(data: number, fact: TFact): boolean {
    return !!(data & fact);
  }

  static getDetails(data: number, factsMap: TFactsMap): string {
    const rv: string[] = [];

    for (const [fact, descriptor] of factsMap) {
      Fact.check(data, fact) &&
        rv.push(`${descriptor.tag}: ${descriptor.details}`);
    }

    return rv.join('\n');
  }

  static getTags(data: number, factsMap: TFactsMap): string {
    let rv = '';

    for (const [fact, descriptor] of factsMap) {
      if (Fact.check(data, fact)) {
        rv += descriptor.tag;
      }
    }

    return rv;
  }
}
