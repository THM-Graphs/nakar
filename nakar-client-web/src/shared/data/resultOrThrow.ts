import { mapResult } from "./mapResult.ts";

export function resultOrThrow<T>(
  result:
    | {
        data: T;
        error: undefined;
      }
    | {
        data: undefined;
        error: unknown;
      },
): T {
  return mapResult(
    result,
    (d) => d,
    (error) => {
      throw error;
    },
  );
}
