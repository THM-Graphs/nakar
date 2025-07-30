import { Stack } from "react-bootstrap";
import { DetailPaneAction } from "./DetailPaneAction.ts";
import { GraphProperty } from "../../../../../src-gen";
import { PropertiesDisplay } from "./PropertiesDisplay.tsx";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { ReactNode, useState } from "react";
import { RoomContext } from "../../../../pages/Room.tsx";
import { PropertyMenu } from "../../PropertyMenu.tsx";
import clsx from "clsx";
import { Collapsable } from "../../Collapsable.tsx";
import { ClipboardButton } from "../../ClipboardButton.tsx";

export function DetailPane(props: {
  title: string;
  subTitleElements?: ReactNode;
  actions: DetailPaneAction[];
  properties: GraphProperty[];
  otherProperties: GraphProperty[];
  roomContext: RoomContext;
  elementId: string;
  children?: ReactNode;
}) {
  const uiLocked = useBearStore((s) => s.room.ui.locked);

  const [showFullTitle, setShowFullTitle] = useState(false);

  const titleLengthLimit = 100;

  return (
    <Stack className={"pb-5 pt-1"} gap={0}>
      {props.title.length > 0 && (
        <Stack
          direction={"horizontal"}
          className={"justify-content-between align-items-baseline"}
        >
          <Stack className={"flex-grow-0"}>
            <ClipboardButton text={props.title}></ClipboardButton>
            {props.title.length > titleLengthLimit && !showFullTitle && (
              <NavbarButton
                icon={"chevron-right"}
                className={"align-self-baseline"}
                onClick={() => {
                  setShowFullTitle(true);
                }}
              ></NavbarButton>
            )}
            {props.title.length > titleLengthLimit && showFullTitle && (
              <NavbarButton
                className={"align-self-baseline"}
                icon={"chevron-down"}
                onClick={() => {
                  setShowFullTitle(false);
                }}
              ></NavbarButton>
            )}
          </Stack>
          <Stack>
            <span
              style={{ overflowWrap: "anywhere", userSelect: "text" }}
              className={"fs-5 fw-bold align-self-baseline"}
            >
              {props.title.length > titleLengthLimit && !showFullTitle
                ? props.title.substring(0, titleLengthLimit) + "…"
                : props.title}
            </span>
          </Stack>
          <PropertyMenu
            roomContext={props.roomContext}
            value={props.title}
          ></PropertyMenu>
        </Stack>
      )}
      <Stack direction={"horizontal"} className={"justify-content-between"}>
        <Stack direction={"horizontal"} className={"ellipsis"}>
          <ClipboardButton text={props.elementId}></ClipboardButton>
          <span className={"ellipsis text-muted small user-select-text"}>
            {props.elementId}
          </span>
        </Stack>
        <PropertyMenu
          roomContext={props.roomContext}
          value={props.elementId}
        ></PropertyMenu>
      </Stack>
      {props.subTitleElements}
      <Collapsable
        title={<span className={"small fw-bold"}>Actions</span>}
        className={"border-top flex-grow-0"}
        initialState={false}
      >
        {props.actions.length > 0 && (
          <Stack direction={"horizontal"} className={"flex-wrap"}>
            {props.actions.map((action: DetailPaneAction, index: number) => (
              <NavbarButton
                key={action.title}
                onClick={action.action}
                disabled={uiLocked || action.disabled}
                className={clsx(
                  "flex-grow-1 justify-content-between w-50 border-top",
                  index % 2 == 0 && "border-end",
                )}
                title={action.title}
                icon={action.icon}
              ></NavbarButton>
            ))}
          </Stack>
        )}
      </Collapsable>
      <Collapsable
        title={<span className={"small fw-bold"}>Properties</span>}
        className={"border-top flex-grow-0"}
        initialState={false}
      >
        <PropertiesDisplay
          title={"Property"}
          properties={props.properties}
          roomContext={props.roomContext}
          elementId={props.elementId}
        ></PropertiesDisplay>
      </Collapsable>
      <Collapsable
        title={<span className={"small fw-bold"}>Other Properties</span>}
        className={"border-top border-bottom flex-grow-0"}
        initialState={false}
      >
        <PropertiesDisplay
          title={"Property"}
          properties={props.otherProperties}
          roomContext={props.roomContext}
          elementId={props.elementId}
        ></PropertiesDisplay>
      </Collapsable>
      {props.children}
      <div className={"flex-grow-1"}></div>
    </Stack>
  );
}
