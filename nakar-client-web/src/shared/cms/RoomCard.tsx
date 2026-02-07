import { RoomVisibilityDisplay } from "./RoomVisibilityDisplay.tsx";
import { Link } from "react-router";
import { Card, Stack } from "react-bootstrap";
import { ProjectPageDto, RoomDto } from "../../../src-gen";
import { CMSCardContent } from "./CMSCardContent.tsx";
import { CSSProperties } from "react";
import { Router } from "../../routing/Router.ts";

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
          <Stack className={"ellipsis"}>
            <Link
              to={Router.getCanvasUrl(props.room.joinCanvasId)}
              className={"ellipsis"}
            >
              {props.room.title}
            </Link>
          </Stack>
        }
        subtitle={
          <RoomVisibilityDisplay
            visibility={props.room.visibility}
          ></RoomVisibilityDisplay>
        }
        rightBodyPaddingStart={400}
        rightBody={
          <Link
            to={Router.getRoomEditUrl(props.project.id, props.room.id)}
            className={"small"}
          >
            Edit
          </Link>
        }
        icon={"person-workspace"}
      ></CMSCardContent>
    </Card>
  );
}
