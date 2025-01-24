import { Room } from "../../../src-gen";
import { NavLink } from "react-router";

export function RoomDisplay(props: { room: Room }) {
  return (
    <>
      <li>
        <NavLink to={`/room/${props.room.id}`}>{props.room.title}</NavLink>
      </li>
    </>
  );
}
