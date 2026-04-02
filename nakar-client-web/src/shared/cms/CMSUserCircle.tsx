import { UserPreviewDto } from "../../../src-gen";
import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";

const size = 30;

export function CMSUserCircle(props: { user: UserPreviewDto }) {
  return (
    <OverlayTrigger
      overlay={
        <Tooltip>{props.user.displayName ?? `Guest ${props.user.id}`}</Tooltip>
      }
    >
      <Stack
        className={
          "bg-body-secondary rounded-circle flex-shrink-0 flex-grow-0 justify-content-center align-items-center"
        }
        style={{
          width: `${size.toString()}px`,
          height: `${size.toString()}px`,
        }}
      >
        <i className={"bi bi-person"}></i>
      </Stack>
    </OverlayTrigger>
  );
}
