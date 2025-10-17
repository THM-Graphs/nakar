import { Room, Rooms } from "../../../src-gen";
import { RoomDisplay } from "./RoomDisplay.tsx";
import { Stack } from "react-bootstrap";
import { AppContext } from "../../lib/state/AppContext.ts";
import { DynamicList } from "../shared/DynamicList.tsx";

export function RoomList(props: { rooms: Rooms | null; context: AppContext }) {
  return (
    <Stack
      gap={0}
      className={
        "mt-5 mb-5 align-self-center border-start border-end border-bottom border-top"
      }
    >
      <DynamicList
        data={props.rooms?.rooms ?? []}
        entityNamePlural={"Rooms"}
        collapsable={true}
        filter={(exp, r) =>
          (r.title ?? r.id).toLowerCase().includes(exp.toLowerCase())
        }
        render={(list) => (
          <>
            {list.map((room: Room) => (
              <RoomDisplay key={room.id} room={room}></RoomDisplay>
            ))}
          </>
        )}
      ></DynamicList>
    </Stack>
  );
}
