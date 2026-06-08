import { useBearStore } from "../../state/useBearStore.ts";
import { Modal, Stack } from "react-bootstrap";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { Panel } from "../../shared/elements/Panel.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { ScenarioIcon } from "../scenarios-panel/ScenarioIcon.tsx";
import { ArgumentDisplay } from "./ArgumentDisplay.tsx";
import { actionControllerLoadScenario, ScenarioArgumentDto } from "api-client";
import { Router } from "../../routing/Router.ts";
import { CanvasSearchData } from "../canvas/CanvasSearchData.ts";
import qs from "qs";
import { ClipboardButton } from "../../shared/elements/ClipboardButton.tsx";
import { Link } from "react-router";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";

export function RunScenarioModal() {
  const roomContext = useCanvasContext();
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  const shown = useBearStore((s) => s.room.scenario.runScenarioModal.shown);
  const close = useBearStore((s) => s.room.scenario.runScenarioModal.close);
  const clean = useBearStore((s) => s.room.scenario.runScenarioModal.clean);
  const scenario = useBearStore(
    (s) => s.room.scenario.runScenarioModal.scenario,
  );
  const scenarioArguments = useBearStore(
    (s) => s.room.scenario.runScenarioModal.arguments,
  );
  const additive = useBearStore(
    (s) => s.room.scenario.runScenarioModal.additive,
  );

  const handleClose = () => {
    close();
  };

  const shareUrl: URL | null = ((): URL | null => {
    if (scenario == null) {
      return null;
    }
    try {
      const canvasSearchData: CanvasSearchData = {
        scenario: {
          id: scenario.id,
          args: scenarioArguments.reduce(
            (
              akku: Record<string, string>,
              next: ScenarioArgumentDto,
            ): Record<string, string> => ({
              ...akku,
              [next.identifier]: next.value,
            }),
            {},
          ),
        },
      };
      const url: URL = new URL(
        window.location.origin +
          Router.getCanvasPath(
            roomContext.initialRoomData.id,
            roomContext.initialCanvasData.id,
          ),
      );
      url.search = qs.stringify(canvasSearchData);
      return url;
    } catch {
      return null;
    }
  })();

  const handleRun = async () => {
    if (scenario == null) {
      return;
    }
    handleClose();
    try {
      resultOrThrow(
        await actionControllerLoadScenario({
          path: {
            roomId: roomContext.initialRoomData.id,
            canvasId: roomContext.initialCanvasData.id,
          },
          body: {
            scenarioId: scenario.id,
            arguments: scenarioArguments,
            additive: additive,
          },
        }),
      );
    } catch (error) {
      pushErrorNotification(error);
    }
  };

  const handleClean = () => {
    clean();
  };

  return (
    <Modal show={shown} onHide={handleClose} onExited={handleClean}>
      {scenario && (
        <>
          <Panel
            title={additive ? "Add Scenario" : "Run Scenario"}
            onClose={handleClose}
            direction={"none"}
            hidden={false}
            fullWidth={true}
          >
            <Stack className={"pb-3 pt-3"} gap={3}>
              <Stack direction={"horizontal"} gap={2} className={"ps-3 pe-3"}>
                <ScenarioIcon size={40} scenario={scenario}></ScenarioIcon>
                <span className={"user-select-text fw-semibold"}>
                  {scenario.title}
                </span>
              </Stack>
              <span className={"small text-muted ps-3 pe-3"}>
                This scenario requires arguments. Please provide the required
                values.
                <br />
                You can enter text or JSON-data.
              </span>
              {scenarioArguments.map((arg, index) => (
                <ArgumentDisplay
                  key={arg.identifier}
                  arg={arg}
                  scenario={scenario}
                  autoFocus={index === 0}
                ></ArgumentDisplay>
              ))}
              {shareUrl != null && (
                <Collapsable
                  title={
                    <span className={"small text-muted"}>Share Run URL</span>
                  }
                  collapsed={true}
                >
                  <Stack className={"ps-3 pe-3"}>
                    <Stack direction={"horizontal"}>
                      <span className={"small text-muted ellipsis"}>
                        <Link to={shareUrl}>{shareUrl.toString()}</Link>
                      </span>
                      <ClipboardButton
                        text={shareUrl.toString()}
                      ></ClipboardButton>
                    </Stack>
                    <span className={"text-muted small"}>
                      Use this url to run this scenario using the given
                      arguments in this canvas.
                    </span>
                  </Stack>
                </Collapsable>
              )}
            </Stack>
            <Stack
              direction={"horizontal"}
              className={"border-top justify-content-between"}
            >
              <NavbarButton
                title={"Cancel"}
                icon={"x-lg"}
                onClick={handleClose}
                className={"ps-1 pe-1 justify-content-center border-end"}
              ></NavbarButton>
              <Stack direction={"horizontal"}>
                <NavbarButton
                  onClick={handleRun}
                  className={"ps-1 pe-1 justify-content-center border-start"}
                  title={additive ? "Add Scenario" : "Run Scenario"}
                  icon={additive ? "plus-circle-fill" : "play-circle-fill"}
                ></NavbarButton>
              </Stack>
            </Stack>
          </Panel>
        </>
      )}
    </Modal>
  );
}
