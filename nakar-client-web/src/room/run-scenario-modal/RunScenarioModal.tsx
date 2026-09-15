import { useBearStore } from "../../state/useBearStore.ts";
import { Modal, Stack } from "react-bootstrap";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { Panel } from "../../shared/elements/Panel.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { ScenarioIcon } from "../scenarios-panel/ScenarioIcon.tsx";
import { ArgumentDisplay } from "./ArgumentDisplay.tsx";
import { actionControllerLoadScenario } from "api-client";
import { ClipboardButton } from "../../shared/elements/ClipboardButton.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { createScenarioShareUrl } from "../scenarios-panel/createScenarioShareUrl.ts";

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
    return createScenarioShareUrl(scenario, roomContext, scenarioArguments);
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
                      <span className={"small text-muted text-break"}>
                        <a href={shareUrl.toString()} target={"_blank"}>
                          {shareUrl.toString()}
                        </a>
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
