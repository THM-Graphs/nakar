import { mapResult } from "./mapResult.ts";
import { Loadable } from "./Loadable.ts";
import { handleError } from "../error/handleError.ts";

export function loadableFromResult<T>(
  result:
    | {
        data: T;
        error: undefined;
      }
    | {
        data: undefined;
        error: unknown;
      },
): Loadable<T> {
  return mapResult(
    result,
    (d: T): Loadable<T> => ({ type: "data", data: d }),
    (error: unknown): Loadable<T> => ({
      type: "error",
      message: handleError(error),
    }),
  );
}
