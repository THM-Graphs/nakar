import { GraphDataToggle } from "../GraphDataToggle.tsx";
import { Dropdown, Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";
import {
  postRoomActionCompressRelationships,
  postRoomActionConnectResultNodes,
  postRoomActionRedo,
  postRoomActionRelayout,
  postRoomActionReloadScenario,
  postRoomActionRemoveDanglingNodes,
  postRoomActionUndo,
  postRoomActionUnlockAllNodes,
} from "../../../../src-gen";
import { RoomContext } from "../../../pages/Room.tsx";
import { resultOrThrow } from "../../../lib/data/resultOrThrow.ts";
import { DropdownButton } from "../../shared/DropdownButton.tsx";
import { exportSVG } from "../../../lib/svg-export/exportSVG.ts";

export function CanvasToolbar(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const graph = useBearStore((s) => s.room.scenario.graph);
  const uiLocked = useBearStore((s) => s.room.ui.locked);
  const selectedTab = useBearStore((s) => s.room.canvas.tabs.selected);
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
  const hideLabels = useBearStore((s) => s.room.canvas.hideLabels);
  const setHideLabels = useBearStore((s) => s.room.canvas.setHideLabels);

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
        <Dropdown.Item
          disabled={graph.metaData.scenario == null || uiLocked}
          onClick={() => {
            postRoomActionReloadScenario({
              path: { id: props.roomContext.initialRoomData.id },
            })
              .then(resultOrThrow)
              .catch(pushErrorNotification);
          }}
        >
          <Stack direction={"horizontal"} gap={2}>
            <i className={"bi bi-arrow-clockwise"}></i>
            <span className={"small"}>Rerun Scenario</span>
          </Stack>
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Item
          disabled={
            graph.metaData.scenario == null ||
            uiLocked ||
            selectedTab !== "graph"
          }
          onClick={() => {
            postRoomActionRelayout({
              path: { id: props.roomContext.initialRoomData.id },
            })
              .then(resultOrThrow)
              .catch(pushErrorNotification);
          }}
        >
          <Stack direction={"horizontal"} gap={2}>
            <i className={"bi bi-tropical-storm"}></i>
            <span className={"small"}>Relayout</span>
          </Stack>
        </Dropdown.Item>
        <Dropdown.Item
          disabled={
            graph.metaData.scenario == null ||
            uiLocked ||
            selectedTab !== "graph"
          }
          onClick={() => {
            postRoomActionUnlockAllNodes({
              path: { id: props.roomContext.initialRoomData.id },
            })
              .then(resultOrThrow)
              .catch(pushErrorNotification);
          }}
        >
          <Stack direction={"horizontal"} gap={2}>
            <i className={"bi bi-unlock"}></i>
            <span className={"small"}>Unlock all nodes</span>
          </Stack>
        </Dropdown.Item>
        <Dropdown.Item
          disabled={graph.metaData.scenario == null || selectedTab !== "graph"}
          onClick={() => {
            setHideLabels(!hideLabels);
          }}
        >
          <Stack direction={"horizontal"} gap={2}>
            <i className={"bi bi-card-text"}></i>
            <span className={"small"}>
              {hideLabels ? "Show Labels" : "Hide Labels"}
            </span>
          </Stack>
        </Dropdown.Item>

        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Item
          disabled={uiLocked || selectedTab !== "graph"}
          onClick={() => {
            postRoomActionConnectResultNodes({
              path: { id: props.roomContext.initialRoomData.id },
            })
              .then(resultOrThrow)
              .catch(pushErrorNotification);
          }}
        >
          <Stack direction={"horizontal"} gap={2}>
            <i className={"bi bi-intersect"}></i>
            <span className={"small"}>Connect Result Nodes</span>
          </Stack>
        </Dropdown.Item>
        <Dropdown.Item
          disabled={
            graph.metaData.scenario == null ||
            uiLocked ||
            selectedTab !== "graph"
          }
          onClick={() => {
            postRoomActionRemoveDanglingNodes({
              path: { id: props.roomContext.initialRoomData.id },
            })
              .then(resultOrThrow)
              .catch(pushErrorNotification);
          }}
        >
          <Stack direction={"horizontal"} gap={2}>
            <i className={"bi bi-eye-slash"}></i>
            <span className={"small"}>Remove Dangling Nodes</span>
          </Stack>
        </Dropdown.Item>
        <Dropdown.Item
          disabled={
            graph.metaData.scenario == null ||
            uiLocked ||
            selectedTab !== "graph"
          }
          onClick={() => {
            postRoomActionCompressRelationships({
              path: { id: props.roomContext.initialRoomData.id },
            })
              .then(resultOrThrow)
              .catch(pushErrorNotification);
          }}
        >
          <Stack direction={"horizontal"} gap={2}>
            <i className={"bi bi-arrows-collapse"}></i>
            <span className={"small"}>Compress Relationships</span>
          </Stack>
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Item
          disabled={selectedTab !== "graph"}
          onClick={() => {
            try {
              exportSVG();
            } catch (error: unknown) {
              pushErrorNotification(error);
            }
          }}
        >
          <Stack direction={"horizontal"} gap={2}>
            <i className={"bi bi-download"}></i>
            <span className={"small"}>Download SVG-File</span>
          </Stack>
        </Dropdown.Item>
      </DropdownButton>
    </Stack>
  );
}
