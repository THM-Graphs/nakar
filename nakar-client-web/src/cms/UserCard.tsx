import { ProjectRole, UserPreview } from "../../src-gen";
import { RoleDisplay } from "./RoleDisplay.tsx";
import { CMSCard } from "./CMSCard.tsx";

export function UserCard(props: { user: UserPreview; role: ProjectRole }) {
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
