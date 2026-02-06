import { RoomVisibilityDisplay } from "./RoomVisibilityDisplay.tsx";
import { Link } from "react-router";
import { Card, Stack } from "react-bootstrap";
import { StartPageRoomDto } from "../../../src-gen";
import { CMSCardContent } from "./CMSCardContent.tsx";
import { CSSProperties } from "react";
import { Router } from "../../routing/Router.ts";

export function PublicRoomCard(props: {
  room: StartPageRoomDto;
  style?: CSSProperties;
  onRemove?: () => void;
}) {
  return (
    <Card style={{ ...props.style }} className={""}>
      <CMSCardContent
        onRemove={props.onRemove}
        title={
          <Stack className={"ellipsis"}>
            <span className={"ellipsis user-select-text"}>
              {props.room.projectTitle}
            </span>
            <Link
              to={Router.getCanvasUrl(props.room.joinCanvasId)}
              className={"ellipsis"}
            >
              {props.room.title}
            </Link>
          </Stack>
        }
        subtitle={
          <RoomVisibilityDisplay
            visibility={props.room.visibility}
          ></RoomVisibilityDisplay>
        }
        icon={"person-workspace"}
      ></CMSCardContent>
    </Card>
  );
}
