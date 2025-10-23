import { ReactNode, useEffect, useState } from "react";
import {
  DatabaseSearchCapabilities,
  getDatabaseSearchCapabilities,
} from "../../../src-gen";
import { Loadable } from "../../data/Loadable.ts";
import { handleError } from "../../error/handleError.ts";
import { resultOrThrow } from "../../data/resultOrThrow.ts";
import { Stack } from "react-bootstrap";
import { match, P } from "ts-pattern";
import { Loading } from "../../shared/elements/Loading.tsx";
import { SuccessIcon } from "./SuccessIcon.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";

export function SearchCapabilitiesDisplay(props: {
  databaseId: string | null;
}) {
  const [capabalities, setCapabilities] = useState<
    Loadable<DatabaseSearchCapabilities | null>
  >({ type: "data", data: null });

  useEffect(() => {
    (async (): Promise<void> => {
      if (props.databaseId == null) {
        setCapabilities({ type: "data", data: null });
      } else {
        try {
          setCapabilities({ type: "loading" });
          const capa = resultOrThrow(
            await getDatabaseSearchCapabilities({
              path: { id: props.databaseId },
            }),
          );
          setCapabilities({ type: "data", data: capa });
        } catch (error) {
          setCapabilities({ type: "error", message: handleError(error) });
        }
      }
    })().catch(console.error);
  }, [props.databaseId]);

  return (
    <Collapsable
      title={<span className={"fw-bold small"}>Search Capabilities</span>}
      className={"border-top border-bottom flex-grow-0"}
      initialState={false}
    >
      {match(capabalities)
        .returnType<ReactNode | null>()
        .with({ type: "loading" }, () => (
          <span className={"text-muted p-2 small"}>
            Loading search capabilities...
          </span>
        ))
        .with({ type: "error" }, (e) => (
          <span className={"text-muted small p-2"}>{e.message}</span>
        ))
        .with({ type: "data", data: P.nullish }, () => null)
        .with({ type: "data", data: P.nonNullable }, (e) => (
          <Stack className={"small p-2"}>
            <span>Exact Match:</span>
            <span>
              <SuccessIcon
                success={e.data.canExactMatchElementId}
              ></SuccessIcon>{" "}
              Element-ID
            </span>
            <span>
              <SuccessIcon success={e.data.canExactMatchLabel}></SuccessIcon>{" "}
              Label
            </span>
            {e.data.exactMatchNodeProperties.length > 0 ? (
              e.data.exactMatchNodeProperties.map((entry) => (
                <span key={`${entry.label}${entry.property}`}>
                  <SuccessIcon success={true}></SuccessIcon> {entry.label}.
                  {entry.property}
                </span>
              ))
            ) : (
              <span>
                <SuccessIcon success={false}></SuccessIcon> Properties
              </span>
            )}
            <span>Fuzzy Match:</span>
            {e.data.fuzzyMatchNodeProperties.length > 0 ? (
              e.data.fuzzyMatchNodeProperties.map((entry) => (
                <span key={`${entry.label}${entry.property}`}>
                  <SuccessIcon success={true}></SuccessIcon> {entry.label}.
                  {entry.property}
                </span>
              ))
            ) : (
              <span>
                <SuccessIcon success={false}></SuccessIcon>{" "}
                <span className={"fst-italic"}>None</span>
              </span>
            )}
          </Stack>
        ))
        .exhaustive()}
    </Collapsable>
  );
}
