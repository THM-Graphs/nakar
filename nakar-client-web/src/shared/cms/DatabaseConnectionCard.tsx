import { Link } from "react-router";
import { DatabaseConnectionDto, ProjectPageDto } from "api-client";
import { CMSCardContent } from "./CMSCardContent.tsx";
import { Card, Stack } from "react-bootstrap";
import { Router } from "../../routing/Router.ts";

export function DatabaseConnectionCard(props: {
  project: ProjectPageDto;
  databaseConnection: DatabaseConnectionDto;
}) {
  return (
    <Card style={{ width: "400px" }}>
      <CMSCardContent
        title={
          <Stack direction={"horizontal"} gap={3}>
            <span>{props.databaseConnection.title}</span>
            <Link
              to={Router.getDatabaseConnectionEditUrl(
                props.project.id,
                props.databaseConnection.id,
              )}
            >
              <i className={"bi bi-pen"}></i>
            </Link>
          </Stack>
        }
        subtitle={
          <Stack>
            {props.databaseConnection.connectionUrl.length == 0 ? (
              <span className={"fst-italic"}>No Connection URL</span>
            ) : (
              <span className={"user-select-text"}>
                {props.databaseConnection.connectionUrl}
              </span>
            )}

            {props.databaseConnection.browserUrl.length > 0 ? (
              <Stack direction={"horizontal"} gap={1}>
                <i className={"bi bi-box-arrow-up-right"}></i>
                <span className={"user-select-text"}>
                  <Link to={props.databaseConnection.browserUrl}>
                    {props.databaseConnection.browserUrl}
                  </Link>
                </span>
              </Stack>
            ) : (
              <span className={"fst-italic"}>No Browser URL</span>
            )}
          </Stack>
        }
        icon={"database"}
      ></CMSCardContent>
    </Card>
  );
}
