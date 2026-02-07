import { Link } from "react-router";
import { DatabaseConnectionDto, ProjectPageDto } from "../../../src-gen";
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
          <Link
            to={Router.getDatabaseConnectionEditUrl(
              props.project.id,
              props.databaseConnection.id,
            )}
          >
            {props.databaseConnection.title}
          </Link>
        }
        subtitle={
          <Stack>
            <span className={"user-select-text"}>
              {props.databaseConnection.connectionUrl}
            </span>
            <span className={"user-select-text"}>
              <i className={"bi bi-box-arrow-up-right"}></i>{" "}
              <Link to={props.databaseConnection.browserUrl}>
                {props.databaseConnection.browserUrl}
              </Link>
            </span>
          </Stack>
        }
        icon={"database"}
      ></CMSCardContent>
    </Card>
  );
}
