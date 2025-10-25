import { useBearStore } from "../../state/useBearStore.ts";
import { Modal, Stack } from "react-bootstrap";
import { resultOrThrow } from "../../data/resultOrThrow.ts";
import { postRoomActionLoadScenario } from "../../../src-gen";
import { RoomContext } from "../../pages/Room.tsx";
import { Panel } from "../../shared/elements/Panel.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { ScenarioIcon } from "../scenarios-panel/ScenarioIcon.tsx";
import { ArgumentDisplay } from "./ArgumentDisplay.tsx";

export function RunScenarioModal(props: { roomContext: RoomContext }) {
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

  const handleClose = () => {
    close();
  };

  const handleRun = async () => {
    if (scenario == null) {
      return;
    }
    handleClose();
    try {
      await resultOrThrow(
        await postRoomActionLoadScenario({
          path: { id: props.roomContext.initialRoomData.id },
          body: {
            scenarioId: scenario.id,
            arguments: scenarioArguments,
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
            title={"Run Scenario"}
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
              <NavbarButton
                onClick={handleRun}
                className={"ps-1 pe-1 justify-content-center border-start"}
              >
                <i
                  className={"bi bi-play-circle-fill btn btn-link p-0 btn-sm"}
                ></i>
                <span className={"small"}>Run</span>
              </NavbarButton>
            </Stack>
          </Panel>
        </>
      )}
    </Modal>
  );
}
