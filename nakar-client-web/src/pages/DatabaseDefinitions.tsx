import {
  databaseDefinitionControllerGet,
  GetDatabaseDefinitionsDto,
} from "../../src-gen/open-api-client";
import { useLoaderData } from "react-router";
import { EntityTable } from "../components/EntityTable.tsx";
import { ReactElement } from "react";

export function DatabaseDefinitions() {
  const loaderData = useLoaderData<GetDatabaseDefinitionsDto>();

  return (
    <EntityTable
      headers={[
        "ID",
        "Title",
        "Host",
        "Port",
        "Username",
        "Create Date",
        "Update Date",
        "Version",
      ]}
      lines={loaderData.databaseDefinitions.map(
        (databaseDefinition): ReactElement => (
          <tr key={databaseDefinition.id}>
            <td>{databaseDefinition.id}</td>
            <td>{databaseDefinition.title}</td>
            <td>{databaseDefinition.host}</td>
            <td>{databaseDefinition.port}</td>
            <td>{databaseDefinition.username}</td>
            <td>{databaseDefinition.createDate}</td>
            <td>{databaseDefinition.updateDate}</td>
            <td>{databaseDefinition.version}</td>
          </tr>
        ),
      )}
      title={"Database Definitions"}
    ></EntityTable>
  );
}

export async function DatabaseDefinitionsLoader(): Promise<GetDatabaseDefinitionsDto> {
  const res = await databaseDefinitionControllerGet();
  if (res.data == null) {
    throw res.error;
  } else {
    return res.data;
  }
}
