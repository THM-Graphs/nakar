import { useCallback, useEffect, useState } from "react";
import { match } from "ts-pattern";
import { handleError } from "../../lib/error/handleError.ts";
import { Room, getRooms, Rooms } from "../../../src-gen";
import { RoomDisplay } from "./RoomDisplay.tsx";
import { Loadable } from "../../lib/data/Loadable.ts";
import { Loading } from "../shared/Loading.tsx";
import { ErrorDisplay } from "../shared/ErrorDisplay.tsx";
import { resultOrThrow } from "../../lib/data/resultOrThrow.ts";
import { Stack } from "react-bootstrap";

export function RoomList() {
  const [rooms, setRooms] = useState<Loadable<Rooms>>({
    type: "loading",
  });

  const reloadRooms = useCallback(() => {
    setRooms({ type: "loading" });
    getRooms()
      .then((result) => {
        const data = resultOrThrow(result);
        setRooms({ type: "data", data: data });
      })
      .catch((error: unknown) => {
        setRooms({ type: "error", message: handleError(error) });
      });
  }, []);

  useEffect(() => {
    reloadRooms();
  }, []);

  return match(rooms)
    .with({ type: "error" }, ({ message }) => (
      <Stack className={"justify-content-center mt-5"} direction={"horizontal"}>
        <ErrorDisplay message={message} onReload={reloadRooms}></ErrorDisplay>
      </Stack>
    ))
    .with({ type: "loading" }, () => (
      <Stack className={"justify-content-center mt-5"} direction={"horizontal"}>
        <Loading></Loading>
      </Stack>
    ))
    .with({ type: "data" }, ({ data }) => (
      <ul>
        {data.rooms.map((room: Room) => (
          <RoomDisplay key={room.id} room={room}></RoomDisplay>
        ))}
      </ul>
    ))
    .exhaustive();
}
