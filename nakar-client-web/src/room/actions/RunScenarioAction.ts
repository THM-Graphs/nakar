import { Action } from "./Action.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import {
  actionControllerLoadScenario,
  NodeDto,
  ScenarioArgumentDto,
  ScenarioDto,
  ScenarioParameterDto,
} from "api-client";
import { convertToTargetTypeStringRepresentation } from "../../shared/data/convertToTargetTypeStringRepresentation.ts";
import { BearState } from "../../state/BearState.ts";

export type RunScenarioActionParams = {
  roomContext: CanvasContextData;
  scenario: ScenarioDto;
  nodes: NodeDto[];
  showRunScenarioModal: BearState["room"]["scenario"]["runScenarioModal"]["open"];
};

export class RunScenarioAction extends Action<RunScenarioActionParams> {
  public static shared: RunScenarioAction = new RunScenarioAction();

  protected async action(props: RunScenarioActionParams): Promise<void> {
    if (props.scenario.parameters.length === 0) {
      return;
    }

    for (const node of props.nodes) {
      const sceanrioArguments: ScenarioArgumentDto[] =
        props.scenario.parameters.map(
          (parameter: ScenarioParameterDto): ScenarioArgumentDto => {
            const nodeParameterValue = node.properties[parameter.identifier];
            const valueToUse: string =
              (nodeParameterValue != null
                ? convertToTargetTypeStringRepresentation(
                    nodeParameterValue,
                    parameter.dataType,
                  )
                : parameter.defaultValue) ?? "";
            return {
              identifier: parameter.identifier,
              value: valueToUse,
            } satisfies ScenarioArgumentDto;
          },
        );

      if (props.scenario.parameters.length === 1 || props.nodes.length > 1) {
        resultOrThrow(
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
