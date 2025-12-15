import { ReactNode, useEffect, useState } from "react";
import {
  DatabaseSearchCapabilities,
  getDatabaseSearchCapabilities,
} from "../../../src-gen";
import { Loadable } from "../../shared/data/Loadable.ts";
import { handleError } from "../../shared/error/handleError.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { Alert, Stack } from "react-bootstrap";
import { match, P } from "ts-pattern";
import { SuccessIcon } from "./SuccessIcon.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";

export function SearchCapabilitiesDisplay(props: {
  databaseId: string | null;
}) {
  const [capabalities, setCapabilities] = useState<
    Loadable<DatabaseSearchCapabilities | null>
  >({ type: "data", data: null });

  const load = async (): Promise<void> => {
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
  };

  useEffect(() => {
    load().catch(console.error);
  }, [props.databaseId]);

  return (
    <Collapsable
      title={<span className={"fw-bold small"}>Search Capabilities</span>}
      className={"border-top flex-grow-0"}
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
          <Stack>
            <Alert
              variant={"danger"}
              className={"small rounded-0 border-start-0 border-end-0 mb-0"}
            >
              <span>{e.message}</span>
            </Alert>
            <NavbarButton
              title={"Reload"}
              icon={"arrow-clockwise"}
              onClick={load}
            ></NavbarButton>
          </Stack>
        ))
        .with({ type: "data", data: P.nullish }, () => null)
        .with({ type: "data", data: P.nonNullable }, (e) => (
          <Stack className={"small p-2"}>
            <span>Equality Match:</span>
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
                  <SuccessIcon success={true}></SuccessIcon>{" "}
                  <span className={"font-monospace user-select-text"}>
                    {entry.label}
                  </span>
                  <i className={"bi bi-arrow-right ms-1 me-1"}></i>
                  <span className={"font-monospace user-select-text"}>
                    {entry.property}
                  </span>
                </span>
              ))
            ) : (
              <span>
                <SuccessIcon success={false}></SuccessIcon> Properties
              </span>
            )}
            <span>
              <span className={"font-monospace"}>CONTAINS</span> Match:
            </span>
            {e.data.fuzzyMatchNodeProperties.length > 0 ? (
              e.data.fuzzyMatchNodeProperties.map((entry) => (
                <span key={`${entry.label}${entry.property}`}>
                  <SuccessIcon success={true}></SuccessIcon>{" "}
                  <span className={"font-monospace user-select-text"}>
                    {entry.label}
                  </span>
                  <i className={"bi bi-arrow-right ms-1 me-1"}></i>
                  <span className={"font-monospace user-select-text"}>
                    {entry.property}
                  </span>
                </span>
              ))
            ) : (
              <span>
                <SuccessIcon success={false}></SuccessIcon>{" "}
                <span className={"fst-italic"}>None</span>
              </span>
            )}
            <span className={"mt-2 text-muted"}>
              NAKAR uses <span className={"font-monospace"}>LOOKUP</span> and{" "}
              <span className={"font-monospace"}>RANGE</span> indexes for
              equality (<span className={"font-monospace"}>=</span>) matches and{" "}
              <span className={"font-monospace"}>TEXT</span> indexes for{" "}
              <span className={"font-monospace"}>CONTAINS</span> matches.
            </span>
          </Stack>
        ))
        .exhaustive()}
    </Collapsable>
  );
}
