import { RoomDto } from "api-client";
import { Card, Stack } from "react-bootstrap";
import { RoomVisibilityDisplay } from "./RoomVisibilityDisplay.tsx";
import { Fragment } from "react";
import clsx from "clsx";

export function RoomVisibilityEditor(props: {
  value: RoomDto["visibility"];
  onChange: (newValue: RoomDto["visibility"]) => void;
}) {
  return (
    <>
      <Card className={"p-3"}>
        <Stack gap={3}>
          <span>Visibility</span>
          {(
            [
              [
                "public",
                "Everyone can see this room on the start page of NAKAR.",
              ],
              [
                "unlisted",
                "Everyone can join this room using its public link. This room will not show up on the start page.",
              ],
              [
                "private",
                "Only logged in users who are the owner or collaborator of the project can see or join this room.",
              ],
            ] satisfies [RoomDto["visibility"], string][]
          ).map((visibility) => (
            <Fragment key={visibility[0]}>
              <Stack
                direction={"horizontal"}
                gap={3}
                className={clsx(
                  "rounded ps-3 pe-3 pt-2 pb-2 pointer border",
                  visibility[0] === props.value
                    ? "bg-body-secondary bg-body-hover"
                    : "bg-body-tertiary bg-body-secondary-hover",
                )}
                style={{ maxWidth: "500px" }}
                onClick={() => {
                  props.onChange(visibility[0]);
                }}
              >
                <input
                  type={"radio"}
                  checked={visibility[0] === props.value}
                  readOnly={true}
                ></input>
                <Stack>
                  <Stack direction={"horizontal"} gap={1}>
                    <RoomVisibilityDisplay
                      visibility={visibility[0]}
                    ></RoomVisibilityDisplay>
                  </Stack>
                  <span className={"text-muted small"}>{visibility[1]}</span>
                </Stack>
              </Stack>
            </Fragment>
          ))}
        </Stack>
      </Card>
    </>
  );
}
