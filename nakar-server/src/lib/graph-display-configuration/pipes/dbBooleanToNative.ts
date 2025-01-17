import { match, P } from 'ts-pattern';
import { DBGraphDisplayConfigurationBoolean } from '../../documents/types/DBGraphDisplayConfigurationBoolean';

export function dbBooleanToNative(
  input: DBGraphDisplayConfigurationBoolean | null | undefined,
): boolean | null {
  return match(input)
    .returnType<boolean | null>()
    .with(P.nullish, () => null)
    .with('inherit', () => null)
    .with('true', () => true)
    .with('false', () => false)
    .exhaustive();
}
