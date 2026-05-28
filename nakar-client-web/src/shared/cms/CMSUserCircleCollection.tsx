import { UserPreviewDto } from "api-client";
import { Stack } from "react-bootstrap";
import { CMSUserCircle } from "./CMSUserCircle.tsx";

export function CMSUserCircleCollection(props: {
  users: UserPreviewDto[];
  limit?: number;
}) {
  const limitToUse = props.limit ?? 3;
  const isCollapsed = props.users.length > limitToUse;

  return (
    <Stack direction={"horizontal"} className={"gap-1"}>
      {props.users.slice(0, limitToUse).map((user) => (
        <CMSUserCircle key={user.id} user={user} />
      ))}
      {isCollapsed && (
        <span className={"small text-muted flex-shrink-0 flex-grow-0"}>
          +{props.users.length - limitToUse}
        </span>
      )}
    </Stack>
  );
}
