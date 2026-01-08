import { CMSCard } from "./CMSCard.tsx";
import { RoomVisibilityDisplay } from "./RoomVisibilityDisplay.tsx";
import { Link } from "react-router";
import { Stack } from "react-bootstrap";
import { RoomDto, StartPageRoomDto } from "../../../src-gen-2";
import { match, P } from "ts-pattern";

export function RoomCard(props: {
  room: RoomDto | StartPageRoomDto;
  width?: number;
}) {
  return (
    <CMSCard
      width={props.width}
      title={
        <Stack>
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
          <Link to={`/room/${props.room.id}`}>{props.room.title}</Link>
        </Stack>
      }
      subtitle={
        <RoomVisibilityDisplay
          visibility={props.room.visibility}
        ></RoomVisibilityDisplay>
      }
      icon={"person-workspace"}
    ></CMSCard>
  );
}
