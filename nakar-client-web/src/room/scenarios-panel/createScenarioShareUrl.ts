import { CanvasSearchData } from "../canvas/CanvasSearchData.ts";
import { ScenarioArgumentDto, ScenarioDto } from "api-client";
import { Router } from "../../routing/Router.ts";
import qs from "qs";
import { CanvasContextData } from "../../pages/Canvas.tsx";

export function createScenarioShareUrl(
  scenario: ScenarioDto,
  roomContext: CanvasContextData,
  scenarioArguments: ScenarioArgumentDto[],
): URL {
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
}
