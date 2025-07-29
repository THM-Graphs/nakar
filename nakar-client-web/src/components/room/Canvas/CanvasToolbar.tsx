import { GraphDataToggle } from "../GraphDataToggle.tsx";
import { Dropdown, Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";
import {
  postRoomActionCompressNodes,
  postRoomActionCompressRelationships,
  postRoomActionConnectResultNodes,
  postRoomActionRedo,
  postRoomActionReloadScenario,
  postRoomActionRemoveDanglingNodes,
  postRoomActionUndo,
} from "../../../../src-gen";
import { RoomContext } from "../../../pages/Room.tsx";
import { resultOrThrow } from "../../../lib/data/resultOrThrow.ts";
import { DropdownButton } from "../../shared/DropdownButton.tsx";
import { Label } from "./Label.tsx";
import { getBackgroundColor } from "../../../lib/color/getBackgroundColor.ts";
import { getTextColor } from "../../../lib/color/getTextColor.ts";

export function CanvasToolbar(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const graph = useBearStore((s) => s.room.scenario.graph);
  const uiLocked = useBearStore((s) => s.room.ui.locked);
  const selectedTab = useBearStore((s) => s.room.canvas.tabs.selected);

  return (
    <Stack
      direction={"horizontal"}
      className={
        "flex-grow-0 bg-body flex-shrink-0 border-bottom align-items-center justify-content-between flex-wrap z-2"
      }
    >
      <Stack direction={"horizontal"}>
        <NavbarButton
          icon={"arrow-left"}
          disabled={!graph.metaData.canUndo || uiLocked}
          onClick={async () => {
            resultOrThrow(
              await postRoomActionUndo({
                path: {
                  id: props.roomContext.initialRoomData.id,
                },
              }),
            );
          }}
        ></NavbarButton>
        <NavbarButton
          icon={"arrow-right"}
          disabled={!graph.metaData.canRedo || uiLocked}
          onClick={async () => {
            resultOrThrow(
              await postRoomActionRedo({
                path: {
                  id: props.roomContext.initialRoomData.id,
                },
              }),
            );
          }}
        ></NavbarButton>
        <GraphDataToggle></GraphDataToggle>
      </Stack>

      {graph.metaData.scenario && (
        <>
          <span className={"small text-muted ps-1 pe-1"}>
            Scenario:{" "}
            <span className={"user-select-text"}>
              {graph.metaData.scenario.current.title}
            </span>
          </span>
        </>
      )}
      <DropdownButton title={"Actions"} icon={"chevron-down"} align={"end"}>
        <NavbarButton
          disabled={graph.metaData.scenario == null || uiLocked}
          icon={"arrow-clockwise"}
          title={"Rerun Scenario"}
          onClick={async () => {
            resultOrThrow(
              await postRoomActionReloadScenario({
                path: { id: props.roomContext.initialRoomData.id },
              }),
            );
          }}
        ></NavbarButton>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Header>Actions</Dropdown.Header>
        <NavbarButton
          disabled={uiLocked || selectedTab !== "graph"}
          icon={"intersect"}
          title={"Connect Result Nodes"}
          onClick={async () => {
            resultOrThrow(
              await postRoomActionConnectResultNodes({
                path: { id: props.roomContext.initialRoomData.id },
              }),
            );
          }}
        ></NavbarButton>
        <NavbarButton
          disabled={
            graph.metaData.scenario == null ||
            uiLocked ||
            selectedTab !== "graph"
          }
          icon={"eye-slash"}
          title={"Remove Dangling Nodes"}
          onClick={async () => {
            resultOrThrow(
              await postRoomActionRemoveDanglingNodes({
                path: { id: props.roomContext.initialRoomData.id },
              }),
            );
          }}
        ></NavbarButton>
        <NavbarButton
          disabled={
            graph.metaData.scenario == null ||
            uiLocked ||
            selectedTab !== "graph"
          }
          icon={"arrows-collapse"}
          title={"Compress Relationships"}
          onClick={async () => {
            resultOrThrow(
              await postRoomActionCompressRelationships({
                path: { id: props.roomContext.initialRoomData.id },
              }),
            );
          }}
        ></NavbarButton>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Header>Compress Nodes</Dropdown.Header>
        {graph.elements.labels.map((label) => (
          <NavbarButton
            key={label.label}
            disabled={
              graph.metaData.scenario == null ||
              uiLocked ||
              selectedTab !== "graph"
            }
            onClick={async () => {
              resultOrThrow(
                await postRoomActionCompressNodes({
                  path: { id: props.roomContext.initialRoomData.id },
                  body: {
                    label: label.label,
                  },
                }),
              );
            }}
            className={"w-100"}
          >
            <div
              style={{
                backgroundColor: getBackgroundColor(label.color),
                color: getTextColor(label.color),
                width: "15px",
                height: "15px",
              }}
              className={"rounded-circle"}
            ></div>
            <span className={"small"}>{label.label}</span>
          </NavbarButton>
        ))}
      </DropdownButton>
    </Stack>
  );
}
