import { CMSCard } from "./CMSCard.tsx";
import { RoomVisibilityDisplay } from "./RoomVisibilityDisplay.tsx";
import { Link } from "react-router";
import { Stack } from "react-bootstrap";
import { RoomDto, StartPageRoomDto } from "../../../src-gen";
import { match, P } from "ts-pattern";
import { CMSCardContent } from "./CMSCardContent.tsx";

export function RoomCard(props: {
  room: RoomDto | StartPageRoomDto;
  width?: number;
}) {
  return (
    <CMSCard width={props.width} className={"flex-grow-1 flex-shrink-1"}>
      <CMSCardContent
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
      ></CMSCardContent>
    </CMSCard>
  );
}
