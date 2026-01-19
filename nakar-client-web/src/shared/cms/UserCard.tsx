import { RoleDisplay } from "./RoleDisplay.tsx";
import { CMSCard } from "./CMSCard.tsx";
import { UserPreviewDto } from "../../../src-gen";
import { CMSCardContent } from "./CMSCardContent.tsx";

export function UserCard(props: { user: UserPreviewDto; role: UserCardRole }) {
  return (
    <CMSCard>
      <CMSCardContent
        width={300}
        title={
          <span className={"user-select-text"}>{props.user.displayName}</span>
        }
        subtitle={RoleDisplay(props.role)}
        icon={"person-circle"}
      ></CMSCardContent>
    </CMSCard>
  );
}

export type UserCardRole = "owner" | "collaborator" | "none";
