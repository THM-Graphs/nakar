import { Stack } from "react-bootstrap";
import { DetailPaneAction } from "./DetailPaneAction.ts";
import {
  getParameterizedScenariosOfGraphElement,
  GraphProperty,
  ScenarioGroup,
} from "../../../../../src-gen";
import { PropertiesDisplay } from "./PropertiesDisplay.tsx";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { ReactNode, useEffect, useState } from "react";
import { RoomContext } from "../../../../pages/Room.tsx";
import { PropertyMenu } from "./PropertyMenu.tsx";
import clsx from "clsx";
import { Loadable } from "../../../../lib/data/Loadable.ts";
import { resultOrThrow } from "../../../../lib/data/resultOrThrow.ts";
import { handleError } from "../../../../lib/error/handleError.ts";
import { Collapsable } from "../../Collapsable.tsx";

export function DetailPane(props: {
  title: string;
  subTitleElements?: ReactNode;
  actions: DetailPaneAction[];
  properties: GraphProperty[];
  otherProperties: GraphProperty[];
  roomContext: RoomContext;
  elementId: string;
}) {
  const uiLocked = useBearStore((s) => s.room.ui.locked);

  const [
    scenarioGroupsWithParameterizedScenarios,
    setScenarioGroupsWithParameterizedScenarios,
  ] = useState<Loadable<ScenarioGroup[]>>({ type: "loading" });

  const [showFullTitle, setShowFullTitle] = useState(false);

  const reload = async () => {
    try {
      setScenarioGroupsWithParameterizedScenarios({
        type: "data",
        data: resultOrThrow<ScenarioGroup[]>(
          await getParameterizedScenariosOfGraphElement({
            path: {
              roomId: props.roomContext.initialRoomData.id,
              elementId: props.elementId,
            },
          }),
        ),
      });
    } catch (error) {
      setScenarioGroupsWithParameterizedScenarios({
        type: "error",
        message: handleError(error),
      });
    }
  };

  useEffect(() => {
    (async () => {
      await reload();
    })().catch(console.error);
  }, []);

  const titleLengthLimit = 100;

  return (
    <Stack className={"pb-5 pt-1"} gap={0}>
      {props.title.length > 0 && (
        <Stack
          direction={"horizontal"}
          className={"justify-content-between align-items-baseline"}
        >
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
          <Stack>
            <span
              style={{ overflowWrap: "anywhere", userSelect: "text" }}
              className={"ps-2 pe-2 fs-5 fw-bold align-self-baseline"}
            >
              {props.title.length > titleLengthLimit && !showFullTitle
                ? props.title.substring(0, titleLengthLimit) + "…"
                : props.title}
            </span>
          </Stack>
          <PropertyMenu
            scenarioGroupsWithParameterizedScenarios={
              scenarioGroupsWithParameterizedScenarios
            }
            onReload={reload}
            roomContext={props.roomContext}
            value={props.elementId}
          ></PropertyMenu>
        </Stack>
      )}
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
          onReload={reload}
          scenarioGroupsWithParameterizedScenarios={
            scenarioGroupsWithParameterizedScenarios
          }
        ></PropertiesDisplay>
      </Collapsable>
      <Collapsable
        title={<span className={"small fw-bold"}>Other Properties</span>}
        className={"border-top border-bottom flex-grow-0"}
      >
        <PropertiesDisplay
          title={"Other Property"}
          properties={props.otherProperties}
          roomContext={props.roomContext}
          elementId={props.elementId}
          onReload={reload}
          scenarioGroupsWithParameterizedScenarios={
            scenarioGroupsWithParameterizedScenarios
          }
        ></PropertiesDisplay>
      </Collapsable>
      <div className={"flex-grow-1"}></div>
    </Stack>
  );
}
