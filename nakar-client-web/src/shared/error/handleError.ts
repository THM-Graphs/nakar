import { match, P } from "ts-pattern";

export function handleError(error: unknown): string {
  return match(error)
    .with(P.instanceOf(Error), (error) => error.message)
    .with(P.string, (error) => error)
    .with({ message: P.string }, (error) => error.message)
    .with({ message: P.array(P.string) }, (error) => error.message.join(", "))
    .with(
      { error: { message: P.string, status: P.number } },
      (error) => `${error.error.message} (${error.error.status.toString()})`,
    )
    .with(
      { data: P.string, status: P.number },
      (error) => `${error.data} (${error.status.toString()})`,
    )
    .otherwise((v) => JSON.stringify(v));
}
