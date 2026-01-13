import { RoleDisplay } from "./RoleDisplay.tsx";
import { CMSCard } from "./CMSCard.tsx";
import { UserPreviewDto } from "../../../src-gen";

export function UserCard(props: { user: UserPreviewDto; role: UserCardRole }) {
  return (
    <CMSCard
      width={300}
      title={
        <span className={"user-select-text"}>{props.user.displayName}</span>
      }
      subtitle={RoleDisplay(props.role)}
      icon={"person-circle"}
    ></CMSCard>
  );
}

export type UserCardRole = "owner" | "collaborator" | "none";
