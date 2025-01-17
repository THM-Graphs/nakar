import { match, P } from 'ts-pattern';
import { ScaleType } from '../types/ScaleType';
import { DBScaleType } from '../../documents/types/DBScaleType';

export function dbScaleTypeToNative(
  input: DBScaleType | null | undefined,
): ScaleType | null {
  return match(input)
    .with(P.nullish, () => null)
    .with('inherit', () => null)
    .with('linear', () => ScaleType.linear)
    .with('log10', () => ScaleType.log10)
    .with('logn', () => ScaleType.logN)
    .with('log2', () => ScaleType.log2)
    .exhaustive();
}
