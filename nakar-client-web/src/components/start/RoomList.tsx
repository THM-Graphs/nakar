import { useEffect, useState } from "react";
import { match, P } from "ts-pattern";
import { handleError } from "../../lib/error/handleError.ts";
import { GetRoom, getRooms, GetRooms } from "../../../src-gen";
import { RoomDisplay } from "./RoomDisplay.tsx";
import { Loadable } from "../../lib/data/Loadable.ts";
import { Loading } from "../shared/Loading.tsx";
import { ErrorDisplay } from "../shared/ErrorDisplay.tsx";

export function RoomList() {
  const [rooms, setRooms] = useState<Loadable<GetRooms>>({
    type: "loading",
  });

  useEffect(() => {
    setRooms({ type: "loading" });
    getRooms()
      .then((result) => {
        match(result)
          .with(
            { data: P.nullish },
            (result: { data: undefined; error: unknown }) => {
              setRooms({ type: "error", message: handleError(result.error) });
            },
          )
          .otherwise((result: { data: GetRooms; error: undefined }) => {
            setRooms({ type: "data", data: result.data });
          });
      })
      .catch((error: unknown) => {
        setRooms({ type: "error", message: handleError(error) });
      });
  }, []);

  return match(rooms)
    .with({ type: "error" }, ({ message }) => (
      <ErrorDisplay message={message}></ErrorDisplay>
    ))
    .with({ type: "loading" }, () => <Loading></Loading>)
    .with({ type: "data" }, ({ data }) => (
      <ul>
        {data.rooms.map((room: GetRoom) => (
          <RoomDisplay key={room.id} room={room}></RoomDisplay>
        ))}
      </ul>
    ))
    .exhaustive();
}
