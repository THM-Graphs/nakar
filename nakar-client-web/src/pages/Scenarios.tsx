import { useLoaderData } from "react-router";
import { EntityTable } from "../components/EntityTable.tsx";
import { ReactElement } from "react";
import {
  GetScenariosDto,
  scenarioControllerGet,
} from "../../src-gen/open-api-client";

export function Scenarios() {
  const loaderData = useLoaderData<GetScenariosDto>();

  return (
    <EntityTable
      headers={[
        "ID",
        "Title",
        "Query",
        "Create Date",
        "Update Date",
        "Version",
      ]}
      lines={loaderData.scenarios.map(
        (databaseDefinition): ReactElement => (
          <tr key={databaseDefinition.id}>
            <td>{databaseDefinition.id}</td>
            <td>{databaseDefinition.title}</td>
            <td>{databaseDefinition.query}</td>
            <td>{databaseDefinition.createDate}</td>
            <td>{databaseDefinition.updateDate}</td>
            <td>{databaseDefinition.version}</td>
          </tr>
        ),
      )}
      title={"Scenarios"}
    ></EntityTable>
  );
}

export async function ScenariosLoader(): Promise<GetScenariosDto> {
  const res = await scenarioControllerGet();
  if (res.data == null) {
    throw res.error;
  } else {
    return res.data;
  }
}
