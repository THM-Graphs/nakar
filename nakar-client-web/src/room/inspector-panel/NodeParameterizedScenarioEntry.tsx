import { NodeDto, ScenarioDto } from "../../../src-gen";
import { useBearStore } from "../../state/useBearStore.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { RunScenarioAction } from "../actions/RunScenarioAction.ts";

export function NodeParameterizedScenarioEntry(props: {
  scenario: ScenarioDto;
  node: NodeDto;
}) {
  const showRunScenarioModal = useBearStore(
    (s) => s.room.scenario.runScenarioModal.open,
  );
  const roomContext = useCanvasContext();

  return (
    <ActionNavbarButton
      action={RunScenarioAction.shared}
      params={{
        roomContext: roomContext,
        scenario: props.scenario,
        node: props.node,
        showRunScenarioModal: showRunScenarioModal,
      }}
      className={"align-self-stretch w-100"}
    ></ActionNavbarButton>
  );
}
