import { Database, Databases, getScenarios } from "../../../../../src-gen";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { handleError } from "../../../../lib/error/handleError.ts";
import { ErrorDisplay } from "../../../shared/ErrorDisplay.tsx";
import { Loading } from "../../../shared/Loading.tsx";
import { DatabaseDisplay } from "./DatabaseDisplay.tsx";
import { Loadable } from "../../../../lib/data/Loadable.ts";
import { resultOrThrow } from "../../../../lib/data/resultOrThrow.ts";
import { Stack } from "react-bootstrap";
import { AppContext } from "../../../../lib/state/AppContext.ts";

export function DatabaseList(props: { context: AppContext }) {
  const [databases, setDatabases] = useState<Loadable<Databases>>({
    type: "loading",
  });

  const reload = () => {
    setDatabases({ type: "loading" });
    getScenarios()
      .then((result) => {
        const data = resultOrThrow(result);
        setDatabases({ type: "data", data: data });
      })
      .catch((error: unknown) => {
        setDatabases({
          type: "error",
          message: handleError(error),
        });
      });
  };

  useEffect(() => {
    reload();
  }, []);

  return match(databases)
    .with({ type: "error" }, ({ message }) => (
      <>
        <ErrorDisplay message={message} onReload={reload}></ErrorDisplay>
        <div className={"flex-grow-1"}></div>
      </>
    ))
    .with({ type: "loading" }, () => (
      <Loading className={"align-self-center"}></Loading>
    ))
    .with({ type: "data" }, ({ data }) => (
      <>
        <Stack className={"pb-5 mb-auto"}>
          {data.databases.map((database: Database) => (
            <DatabaseDisplay
              context={props.context}
              key={database.id}
              database={database}
            ></DatabaseDisplay>
          ))}
        </Stack>
      </>
    ))
    .exhaustive();
}
