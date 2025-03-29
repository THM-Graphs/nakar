import { ScaleType } from '../../../tools/ScaleType';
import { match, P } from 'ts-pattern';

export class DBNullableScaleType {
  public readonly value: ScaleType | null;

  public constructor(value: ScaleType | null) {
    this.value = value;
  }
}
