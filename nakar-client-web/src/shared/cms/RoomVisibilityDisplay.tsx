import { RoomVisibility } from "../../../src-gen";
import { match } from "ts-pattern";

export function RoomVisibilityDisplay(props: { visibility: RoomVisibility }) {
  return match(props.visibility)
    .with("private", () => (
      <>
        <i className={"bi bi-lock"}></i> Private
      </>
    ))
    .with("public", () => (
      <>
        <i className={"bi bi-globe2"}></i> Public
      </>
    ))
    .with("unlisted", () => (
      <>
        <i className={"bi bi-link-45deg"}></i> Unlisted
      </>
    ))
    .exhaustive();
}
