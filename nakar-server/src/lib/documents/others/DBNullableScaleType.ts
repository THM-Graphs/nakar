import { ScaleType } from '../../tools/ScaleType';
import { match, P } from 'ts-pattern';

export class DBNullableScaleType {
  public readonly value: ScaleType | null;

  public constructor(value: ScaleType | null) {
    this.value = value;
  }

  public static parseOrDefault(
    input: 'inherit' | 'linear' | 'log2' | 'logn' | 'log10' | null | undefined,
  ): DBNullableScaleType {
    const value = match(input)
      .with(P.nullish, () => null)
      .with('inherit', () => null)
      .with('linear', () => ScaleType.linear)
      .with('log10', () => ScaleType.log10)
      .with('logn', () => ScaleType.logN)
      .with('log2', () => ScaleType.log2)
      .exhaustive();
    return new DBNullableScaleType(value);
  }
}
