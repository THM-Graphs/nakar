import { RoomPreview } from "../../src-gen";
import { CMSCard } from "./CMSCard.tsx";
import { RoomVisibilityDisplay } from "./RoomVisibilityDisplay.tsx";
import { Link } from "react-router";

export function RoomCard(props: { room: RoomPreview }) {
  return (
    <CMSCard
      title={<Link to={`/room/${props.room.id}`}>{props.room.title}</Link>}
      subtitle={
        <RoomVisibilityDisplay
          visibility={props.room.visibility}
        ></RoomVisibilityDisplay>
      }
      icon={"person-workspace"}
    ></CMSCard>
  );
}
