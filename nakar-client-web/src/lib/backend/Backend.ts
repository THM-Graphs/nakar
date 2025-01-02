import {
  GetInitialGraphDto,
  GetInitialGraphDtoSchema,
  GetScenariosDto,
  GetScenariosDtoSchema,
} from "../../shared/dto.ts";
import { env } from "../env/env.ts";

export class Backend {
  async getScenarios(): Promise<GetScenariosDto> {
    const result = await fetch(`${this.getBaseUrl()}/api/frontend/scenarios`);
    if (!result.ok) {
      throw await result.json();
    }
    const data = GetScenariosDtoSchema.parse(await result.json());
    return data;
  }

  async getInitialGraph(scnenarioId: string): Promise<GetInitialGraphDto> {
    const result = await fetch(
      `${this.getBaseUrl()}/api/frontend/initial-graph?scenarioId=${scnenarioId}`,
    );
    if (!result.ok) {
      throw await result.json();
    }
    const data = GetInitialGraphDtoSchema.parse(await result.json());
    return data;
  }

  getBaseUrl(): string {
    return env().BACKEND_URL;
  }
}
