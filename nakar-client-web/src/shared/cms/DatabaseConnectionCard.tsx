import { DatabaseConnection } from "../../../src-gen";
import { CMSCard } from "./CMSCard.tsx";
import { Link } from "react-router";

export function DatabaseConnectionCard(props: {
  databaseConnection: DatabaseConnection;
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
