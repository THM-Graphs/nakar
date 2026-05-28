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
  if (result.error != null) {
    return onError(result.error);
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return onData(result.data!);
    } catch (error: unknown) {
      return onError(error);
    }
  }
}
