import { CMSCard } from "./CMSCard.tsx";
import { Link } from "react-router";
import { DatabaseConnectionDto } from "../../../src-gen";

export function DatabaseConnectionCard(props: {
  databaseConnection: DatabaseConnectionDto;
}) {
  return (
    <CMSCard
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
    ></CMSCard>
  );
}
