import { RoomVisibilityDisplay } from "./RoomVisibilityDisplay.tsx";
import { Link } from "react-router";
import { Card, Stack } from "react-bootstrap";
import { RoomDto, StartPageRoomDto } from "../../../src-gen";
import { match, P } from "ts-pattern";
import { CMSCardContent } from "./CMSCardContent.tsx";
import { CSSProperties } from "react";

export function RoomCard(props: {
  room: RoomDto | StartPageRoomDto;
  style?: CSSProperties;
}) {
  return (
    <Card style={{ ...props.style }} className={""}>
      <CMSCardContent
        title={
          <Stack className={"ellipsis"}>
            {match(props.room)
              .with(
                { projectTitle: P.string },
                (startPageRoom: StartPageRoomDto) => (
                  <span className={"ellipsis user-select-text"}>
                    {startPageRoom.projectTitle}
                  </span>
                ),
              )
              .otherwise(() => null)}
            <Link to={`/room/${props.room.id}`} className={"ellipsis"}>
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
