import { RoomPreview } from "../../src-gen";
import { CMSCard } from "./CMSCard.tsx";
import { RoomVisibilityDisplay } from "./RoomVisibilityDisplay.tsx";
import { Link } from "react-router";
import { Stack } from "react-bootstrap";

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
      rightBodyPaddingStart={200}
      rightBody={
        <Stack>
          <span className={"text-muted small"}>Canvases</span>
          {props.room.canvases.map((c) => (
            <Link to={`/canvas/${c.id}`}>
              <span key={c.id} className={"small"}>
                {c.title}
              </span>
            </Link>
          ))}
        </Stack>
      }
    ></CMSCard>
  );
}
