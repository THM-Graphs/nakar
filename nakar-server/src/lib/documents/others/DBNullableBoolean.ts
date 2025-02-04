import { match, P } from 'ts-pattern';

export class DBNullableBoolean {
  public readonly value: boolean | null;

  public constructor(value: boolean | null) {
    this.value = value;
  }

  public static parseOrDefault(input: 'inherit' | 'true' | 'false' | null | undefined): DBNullableBoolean {
    const value: boolean | null = match(input)
      .with(P.nullish, (): null => null)
      .with('inherit', (): null => null)
      .with('true', (): boolean => true)
      .with('false', (): boolean => false)
      .exhaustive();
    return new DBNullableBoolean(value);
  }
}
