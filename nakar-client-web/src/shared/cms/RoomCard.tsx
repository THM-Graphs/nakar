import { RoomVisibilityDisplay } from "./RoomVisibilityDisplay.tsx";
import { Link } from "react-router";
import { Card, Stack } from "react-bootstrap";
import { ProjectPageDto, RoomDto } from "api-client";
import { CMSCardContent } from "./CMSCardContent.tsx";
import { CSSProperties } from "react";
import { Router } from "../../routing/Router.ts";
import { ClipboardButton } from "../elements/ClipboardButton.tsx";

export function RoomCard(props: {
  room: RoomDto;
  project: ProjectPageDto;
  style?: CSSProperties;
  onRemove?: () => void;
}) {
  return (
    <Card style={{ ...props.style }} className={""}>
      <CMSCardContent
        onRemove={props.onRemove}
        title={
          <Stack
            direction={"horizontal"}
            gap={3}
            className={"justify-content-start"}
          >
            <Stack className={"ellipsis flex-grow-0"}>
              <Link
                to={Router.getRoomPath(props.room.id)}
                className={"ellipsis"}
              >
                {props.room.title}
              </Link>
            </Stack>
            <Link
              to={Router.getRoomEditPath(props.project.id, props.room.id)}
              className={"small"}
            >
              <i className={"bi bi-pen"}></i>
            </Link>
          </Stack>
        }
        subtitle={
          <RoomVisibilityDisplay
            visibility={props.room.visibility}
          ></RoomVisibilityDisplay>
        }
        icon={"person-workspace"}
        rightBodyPaddingStart={300}
        rightBody={
          <Stack>
            {props.room.visibility === "public" ||
            props.room.visibility === "unlisted" ? (
              <span className={"small"}>
                Public URL:{" "}
                <Link to={Router.getRoomPath(props.room.id)}>
                  {Router.getRoomUrl(props.room.id)}
                </Link>
                <ClipboardButton
                  text={Router.getRoomUrl(props.room.id)}
                ></ClipboardButton>
              </span>
            ) : (
              <span className={"small text-muted fst-italic"}>
                No Public URL
              </span>
            )}
          </Stack>
        }
        users={props.room.activeUsers}
      ></CMSCardContent>
    </Card>
  );
}
