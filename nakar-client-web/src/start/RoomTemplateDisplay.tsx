import { RoomTemplate } from "../../src-gen";
import { useNavigate } from "react-router";
import { Stack } from "react-bootstrap";
import { NavbarButton } from "../shared/elements/NavbarButton.tsx";
import { ClipboardButton } from "../shared/elements/ClipboardButton.tsx";

export function RoomTemplateDisplay(props: { roomTemplate: RoomTemplate }) {
  const navigate = useNavigate();

  const templateUrl = `/room-template/${props.roomTemplate.id}`;

  return (
    <>
      <Stack direction={"horizontal"} className={"flex-shrink-0"}>
        <NavbarButton
          onClick={async () => {
            await navigate(`/room-template/${props.roomTemplate.id}`);
          }}
          className={"flex-shrink-1 flex-grow-1 align-self-baseline"}
          icon={"play-fill"}
        >
          <Stack className={"flex-shrink-1 ms-2"}>
            <span className={"text-wrap text-break small"}>
              {props.roomTemplate.title}
            </span>
          </Stack>
        </NavbarButton>

        {props.roomTemplate.editUrl && (
          <NavbarButton
            icon={"pencil-fill"}
            onClick={() => {
              window.open(props.roomTemplate.editUrl ?? undefined, "_blank");
            }}
            className={"flex-grow-0 flex-shrink-0 align-self-baseline"}
          ></NavbarButton>
        )}

        <ClipboardButton
          text={templateUrl}
          className={"align-self-baseline"}
        ></ClipboardButton>
      </Stack>
    </>
  );
}
