import { match, P } from 'ts-pattern';

export class DBNullableBoolean {
  public readonly value: boolean | null;

  public constructor(value: boolean | null) {
    this.value = value;
  }
}
