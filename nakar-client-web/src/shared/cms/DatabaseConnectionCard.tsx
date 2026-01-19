import { CMSCard } from "./CMSCard.tsx";
import { Link } from "react-router";
import { DatabaseConnectionDto } from "../../../src-gen";
import { CMSCardContent } from "./CMSCardContent.tsx";

export function DatabaseConnectionCard(props: {
  databaseConnection: DatabaseConnectionDto;
}) {
  return (
    <CMSCard>
      <CMSCardContent
        width={400}
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
    </CMSCard>
  );
}
