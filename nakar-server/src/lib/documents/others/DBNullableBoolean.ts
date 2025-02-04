import { match, P } from 'ts-pattern';

export class DBNullableBoolean {
  public readonly value: boolean | null;

  public constructor(value: boolean | null) {
    this.value = value;
  }

  public static parseOrDefault(input: 'inherit' | 'true' | 'false' | null | undefined): DBNullableBoolean {
    const value: boolean | null = match(input)
      .returnType<boolean | null>()
      .with(P.nullish, () => null)
      .with('inherit', () => null)
      .with('true', () => true)
      .with('false', () => false)
      .exhaustive();
    return new DBNullableBoolean(value);
  }
}
