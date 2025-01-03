import { match, P } from "ts-pattern";

export function handleError(error: unknown): string {
  return match(error)
    .with(P.instanceOf(Error), (error) => error.message)
    .with(P.string, (error) => error)
    .with({ message: P.string }, (error) => error.message)
    .otherwise((v) => JSON.stringify(v));
}
