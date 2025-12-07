import { Room } from "../../src-gen";
import { RoomDisplay } from "./RoomDisplay.tsx";
import { Stack } from "react-bootstrap";
import { AppContext } from "../state/AppContext.ts";
import { DynamicList } from "../shared/elements/DynamicList.tsx";
import clsx from "clsx";
import { CSSProperties } from "react";

export function RoomList(props: {
  title?: string;
  rooms: Room[] | null;
  context: AppContext;
  className?: string;
  style?: CSSProperties;
  onDelete?: (room: Room) => void | Promise<void>;
}) {
  return (
    <Stack
      gap={0}
      className={clsx(
        "border-start border-end border-bottom border-top",
        props.className,
      )}
      style={props.style}
    >
      <DynamicList
        sticky={false}
        data={props.rooms ?? []}
        entityNamePlural={props.title ?? "Rooms"}
        collapsable={true}
        filter={(exp, r) =>
          (r.title ?? r.id).toLowerCase().includes(exp.toLowerCase())
        }
        render={(list) => (
          <>
            {list.map((room: Room) => (
              <RoomDisplay
                key={room.id}
                room={room}
                onDelete={props.onDelete}
              ></RoomDisplay>
            ))}
          </>
        )}
      ></DynamicList>
    </Stack>
  );
}
