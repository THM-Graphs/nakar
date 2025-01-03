import {
  GetDatabase,
  getDatabases,
  GetDatabases,
  GetScenario,
} from "../../../src-gen";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { handleError } from "../../lib/error/handleError.ts";
import { ErrorDisplay } from "../shared/ErrorDisplay.tsx";
import { Loading } from "../shared/Loading.tsx";
import { DatabaseDisplay } from "./DatabaseDisplay.tsx";
import { Loadable } from "../../lib/data/Loadable.ts";

export function DatabaseList(props: {
  onScenarioSelect: (scenario: GetScenario) => void;
}) {
  const [databases, setDatabases] = useState<Loadable<GetDatabases>>({
    type: "loading",
  });

  useEffect(() => {
    setDatabases({ type: "loading" });
    getDatabases()
      .then((result) => {
        if (result.error != null) {
          alert(handleError(result.error));
        } else if (result.data != null) {
          setDatabases({ type: "data", data: result.data });
        } else {
          setDatabases({
            type: "error",
            message: "Unknown error",
          });
        }
      })
      .catch((error: unknown) => {
        setDatabases({
          type: "error",
          message: handleError(error),
        });
      });
  }, []);

  return match(databases)
    .with({ type: "error" }, ({ message }) => (
      <ErrorDisplay message={message}></ErrorDisplay>
    ))
    .with({ type: "loading" }, () => <Loading></Loading>)
    .with({ type: "data" }, ({ data }) => (
      <ul>
        {data.databases.map((database: GetDatabase) => (
          <DatabaseDisplay
            onScenarioSelect={props.onScenarioSelect}
            key={database.id}
            database={database}
          ></DatabaseDisplay>
        ))}
      </ul>
    ))
    .exhaustive();
}
