import { RoleDisplay } from "./RoleDisplay.tsx";
import { UserPreviewDto } from "api-client";
import { CMSCardContent } from "./CMSCardContent.tsx";
import { Card } from "react-bootstrap";

export function UserCard(props: { user: UserPreviewDto; role: UserCardRole }) {
  return (
    <Card style={{ width: "300px" }}>
      <CMSCardContent
        title={
          <span className={"user-select-text"}>{props.user.displayName}</span>
        }
        subtitle={RoleDisplay(props.role)}
        icon={"person-circle"}
      ></CMSCardContent>
    </Card>
  );
}

export type UserCardRole = "owner" | "collaborator" | "none";
