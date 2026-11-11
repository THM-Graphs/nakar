import { match, P } from "ts-pattern";
import { ScenarioParameterDto } from "api-client";

export function convertToTargetTypeStringRepresentation(
  argumentValue: unknown,
  dataType: ScenarioParameterDto["dataType"],
): string {
  return match(dataType)
    .with("string", () =>
      match(argumentValue)
        .with(P.string, (s) => s)
        .otherwise((s) => JSON.stringify(s)),
    )
    .with("number", () =>
      match(argumentValue)
        .with(P.string, (s) => s)
        .with(P.boolean, (s) => (s ? "1" : "0"))
        .otherwise((s) => JSON.stringify(s)),
    )
    .with("json", () => JSON.stringify(argumentValue))
    .with("sparqlUri", () =>
      match(argumentValue)
        .with(P.string, (s) => s)
        .otherwise((s) => JSON.stringify(s)),
    )
    .with("urlPathSegment", () =>
      match(argumentValue)
        .with(P.string, (s) => s)
        .otherwise((s) => JSON.stringify(s)),
    )
    .with("startDateTime", () =>
      match(argumentValue)
        .with(P.string, (s) => s)
        .otherwise((s) => JSON.stringify(s)),
    )
    .with("endDateTime", () =>
      match(argumentValue)
        .with(P.string, (s) => s)
        .otherwise((s) => JSON.stringify(s)),
    )
    .exhaustive();
}
