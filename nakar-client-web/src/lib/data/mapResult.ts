export function mapResult<T, R>(
  result:
    | {
        data: T;
        error: undefined;
      }
    | {
        data: undefined;
        error: unknown;
      },
  onData: (data: T) => R,
  onError: (error: unknown) => R,
) {
  if (result.data != null) {
    return onData(result.data);
  } else if (result.error != null) {
    return onError(result.error);
  } else {
    throw new Error(`Unknown error. Cannot handle result.`);
  }
}
