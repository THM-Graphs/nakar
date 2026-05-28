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
): NonNullable<T> {
  return mapResult(
    result,
    (d: T): NonNullable<T> => {
      if (d == null) {
        throw new Error("No data");
      } else {
        return d;
      }
    },
    (error: unknown): never => {
      throw error;
    },
  );
}
