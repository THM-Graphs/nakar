import { StartPageRoomDisplay } from "./StartPageRoomDisplay.tsx";
import { Stack } from "react-bootstrap";
import { AppContext } from "../state/AppContext.ts";
import { DynamicList } from "../shared/elements/DynamicList.tsx";
import clsx from "clsx";
import { CSSProperties } from "react";
import { StartPageRoomDto } from "../../src-gen";

export function RoomList(props: {
  title?: string;
  rooms: StartPageRoomDto[] | null;
  context: AppContext;
  className?: string;
  style?: CSSProperties;
  onDelete?: (room: StartPageRoomDto) => void | Promise<void>;
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
        filter={(exp, r) => r.title.toLowerCase().includes(exp.toLowerCase())}
        render={(list) => (
          <>
            {list.map((room) => (
              <StartPageRoomDisplay
                key={room.id}
                room={room}
                onDelete={props.onDelete}
              ></StartPageRoomDisplay>
            ))}
          </>
        )}
      ></DynamicList>
    </Stack>
  );
}
