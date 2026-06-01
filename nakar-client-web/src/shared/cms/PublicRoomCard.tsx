import { RoomVisibilityDisplay } from "./RoomVisibilityDisplay.tsx";
import { Link } from "react-router";
import { Card, Stack } from "react-bootstrap";
import { StartPageRoomDto } from "api-client";
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
            <Link to={Router.getRoomPath(props.room.id)} className={"ellipsis"}>
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
        users={props.room.activeUsers}
      ></CMSCardContent>
    </Card>
  );
}
