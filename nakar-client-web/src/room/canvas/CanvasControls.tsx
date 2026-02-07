import { ZoomToFitAction } from "../actions/ZoomToFitAction.ts";
import { Stack } from "react-bootstrap";
import { ZoomInAction } from "../actions/ZoomInAction.ts";
import { ZoomOutAction } from "../actions/ZoomOutAction.ts";
import { PanToElementAction } from "../actions/PanToElementAction.ts";
import { HideLabelsAction } from "../actions/HideLabelsAction.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import clsx from "clsx";

export function CanvasControls(props: { className?: string }) {
  const hideLabels = useBearStore((s) => s.room.canvas.hideLabels);
  const setHideLabels = useBearStore((s) => s.room.canvas.setHideLabels);
  const rendererEvents = useBearStore((s) => s.room.ui.rendererEvents);
  const element = useBearStore((s) => s.room.panels.inspector.element);
  const nodes = useBearStore((s) => s.room.scenario.graph.elements.nodes);
  const selectedTab = useBearStore((s) => s.room.canvas.tabs.selected);

  return (
    <Stack className={clsx("align-items-start", props.className)}>
      <ActionNavbarButton
        action={PanToElementAction.shared}
        params={{
          selectedElements: element,
          onCenter: rendererEvents.onCenter,
        }}
        hideTitle={true}
        className={"mb-3"}
        tooltipPlacement={"right"}
      ></ActionNavbarButton>
      <ActionNavbarButton
        action={ZoomInAction.shared}
        params={{
          onZoomIn: rendererEvents.onZoomIn,
          nodes: nodes,
          selectedTab,
        }}
        hideTitle={true}
        tooltipPlacement={"right"}
      ></ActionNavbarButton>
      <ActionNavbarButton
        action={ZoomToFitAction.shared}
        params={{
          onZoomOutOverview: rendererEvents.onZoomOutOverview,
          nodes: nodes,
          selectedTab,
        }}
        hideTitle={true}
        tooltipPlacement={"right"}
      ></ActionNavbarButton>
      <ActionNavbarButton
        action={ZoomOutAction.shared}
        params={{
          onZoomOut: rendererEvents.onZoomOut,
          nodes: nodes,
          selectedTab,
        }}
        hideTitle={true}
        className={"mb-3"}
        tooltipPlacement={"right"}
      ></ActionNavbarButton>
      <ActionNavbarButton
        action={HideLabelsAction.shared}
        params={{ hideLabels, setHideLabels, selectedTab }}
        hideTitle={true}
        tooltipPlacement={"right"}
      ></ActionNavbarButton>
    </Stack>
  );
}
