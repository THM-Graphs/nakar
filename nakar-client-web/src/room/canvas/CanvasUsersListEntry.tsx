import { Stack } from "react-bootstrap";
import { UserPreviewDto } from "api-client";

export function CanvasUsersListEntry(props: { user: UserPreviewDto }) {
  return (
    <Stack
      className={
        "small z-1 rounded bg-body-tertiary shadow-sm border ps-2 pe-2 pe-auto user-select-text"
      }
      direction={"horizontal"}
      gap={1}
    >
      <i className={"bi bi-person"} />
      {props.user.displayName ? (
        <span>{props.user.displayName}</span>
      ) : (
        <span className={""}>Guest ({props.user.id})</span>
      )}
    </Stack>
  );
}
