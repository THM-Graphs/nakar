import { Link } from "react-router";
import { DatabaseConnectionDto } from "../../../src-gen";
import { CMSCardContent } from "./CMSCardContent.tsx";
import { Card } from "react-bootstrap";

export function DatabaseConnectionCard(props: {
  databaseConnection: DatabaseConnectionDto;
}) {
  return (
    <Card style={{ width: "400px" }}>
      <CMSCardContent
        title={
          <Link to={props.databaseConnection.browserUrl}>
            {props.databaseConnection.title}
          </Link>
        }
        subtitle={
          <span className={"user-select-text"}>
            {props.databaseConnection.connectionUrl}
          </span>
        }
        icon={"database"}
      ></CMSCardContent>
    </Card>
  );
}
