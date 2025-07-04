import { Stack } from "react-bootstrap";
import { DetailPaneAction } from "./DetailPaneAction.ts";
import { GraphProperty } from "../../../../../src-gen";
import { PropertyDisplay } from "./PropertyDisplay.tsx";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { ReactNode } from "react";
import { RoomContext } from "../../../../pages/Room.tsx";

export function DetailPane(props: {
  title: string;
  subTitleElements?: ReactNode;
  actions: DetailPaneAction[];
  properties: GraphProperty[];
  otherProperties: GraphProperty[];
  roomContext: RoomContext;
}) {
  const uiLocked = useBearStore((s) => s.room.ui.locked);

  return (
    <Stack className={"pb-5"} gap={1}>
      {props.title.length > 0 && (
        <Stack direction={"horizontal"}>
          <span
            style={{ overflowWrap: "anywhere", userSelect: "text" }}
            className={"pt-1 ps-2 pe-2 fs-5 fw-bold"}
          >
            {props.title}
          </span>
        </Stack>
      )}
      {props.subTitleElements}
      {props.actions.length > 0 && (
        <Stack
          direction={"horizontal"}
          className={"border-top border-bottom mb-2"}
        >
          {props.actions.map((action: DetailPaneAction) => (
            <NavbarButton
              key={action.title}
              onClick={action.action}
              disabled={uiLocked}
              className={"flex-grow-1 justify-content-center"}
              icon={action.icon}
            >
              {action.title}
            </NavbarButton>
          ))}
        </Stack>
      )}
      <PropertyDisplay
        title={"Property"}
        properties={props.properties}
        roomContext={props.roomContext}
      ></PropertyDisplay>
      <PropertyDisplay
        title={"Other Property"}
        properties={props.otherProperties}
        roomContext={props.roomContext}
      ></PropertyDisplay>
      <div className={"flex-grow-1"}></div>
    </Stack>
  );
}
