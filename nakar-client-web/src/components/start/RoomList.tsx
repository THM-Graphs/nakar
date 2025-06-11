import { Room, Rooms } from "../../../src-gen";
import { RoomDisplay } from "./RoomDisplay.tsx";

export function RoomList(props: { rooms: Rooms }) {
  return (
    <ul>
      {props.rooms.rooms.map((room: Room) => (
        <RoomDisplay key={room.id} room={room}></RoomDisplay>
      ))}
    </ul>
  );
}
