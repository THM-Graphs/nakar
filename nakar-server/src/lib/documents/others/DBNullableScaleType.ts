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
    const value: ScaleType | null = match(input)
      .with(P.nullish, (): null => null)
      .with('inherit', (): null => null)
      .with('linear', (): ScaleType => ScaleType.linear)
      .with('log10', (): ScaleType => ScaleType.log10)
      .with('logn', (): ScaleType => ScaleType.logN)
      .with('log2', (): ScaleType => ScaleType.log2)
      .exhaustive();
    return new DBNullableScaleType(value);
  }
}
