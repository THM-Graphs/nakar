import { Room, Rooms } from "../../../src-gen";
import { RoomDisplay } from "./RoomDisplay.tsx";
import { Stack } from "react-bootstrap";
import { AppContext } from "../../lib/state/AppContext.ts";

export function RoomList(props: { rooms: Rooms; context: AppContext }) {
  return (
    <Stack gap={0} className={"pt-5 pb-5 align-self-center"}>
      <span className={"p-1 border-bottom"}>Rooms</span>
      {props.rooms.rooms.map((room: Room) => (
        <RoomDisplay key={room.id} room={room}></RoomDisplay>
      ))}
    </Stack>
  );
}
