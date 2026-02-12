import { Action } from "./Action.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import {
  actionControllerLoadScenario,
  NodeDto,
  ScenarioArgumentDto,
  ScenarioDto,
  ScenarioParameterDto,
} from "../../../src-gen";
import { convertToTargetTypeStringRepresentation } from "../../shared/data/convertToTargetTypeStringRepresentation.ts";
import { BearState } from "../../state/BearState.ts";

export type RunScenarioActionParams = {
  roomContext: CanvasContextData;
  scenario: ScenarioDto;
  node: NodeDto;
  showRunScenarioModal: BearState["room"]["scenario"]["runScenarioModal"]["open"];
};

export class RunScenarioAction extends Action<RunScenarioActionParams> {
  public static shared: RunScenarioAction = new RunScenarioAction();

  protected async action(props: RunScenarioActionParams): Promise<void> {
    if (props.scenario.parameters.length === 0) {
      return;
    }
    const parameter: ScenarioParameterDto = props.scenario.parameters[0];

    const argumentValue: string = convertToTargetTypeStringRepresentation(
      props.node.properties[parameter.identifier],
      parameter.dataType,
    );
    const sceanrioArguments: ScenarioArgumentDto[] = [
      {
        identifier: parameter.identifier,
        value: argumentValue,
      },
    ];

    if (props.scenario.parameters.length === 1) {
      await resultOrThrow(
        await actionControllerLoadScenario({
          path: {
            roomId: props.roomContext.initialRoomData.id,
            canvasId: props.roomContext.initialCanvasData.id,
          },
          body: {
            scenarioId: props.scenario.id,
            arguments: sceanrioArguments,
            additive: true,
          },
        }),
      );
    } else {
      props.showRunScenarioModal(props.scenario, sceanrioArguments, true);
    }
  }

  disabled(): boolean {
    return false;
  }

  icon(): string | null {
    return "plus-circle";
  }

  slug(): string {
    return "run-scenario";
  }

  title(p: RunScenarioActionParams): string {
    return p.scenario.title ?? `Run ${p.scenario.id}`;
  }
}
