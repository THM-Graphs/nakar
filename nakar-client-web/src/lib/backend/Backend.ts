import {
  GetInitialGraphDto,
  GetInitialGraphDtoSchema,
  GetScenariosDto,
  GetScenariosDtoSchema,
} from "../../shared/dto.ts";
import { getEnv } from "../../env.ts";

export class Backend {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = getEnv().backendUrl;
  }

  async getScenarios(): Promise<GetScenariosDto> {
    const result = await fetch(`${this.baseUrl}/api/frontend/scenarios`);
    if (!result.ok) {
      throw await result.json();
    }
    const data = GetScenariosDtoSchema.parse(await result.json());
    return data;
  }

  async getInitialGraph(scnenarioId: string): Promise<GetInitialGraphDto> {
    const result = await fetch(
      `${this.baseUrl}/api/frontend/initial-graph?scenarioId=${scnenarioId}`,
    );
    if (!result.ok) {
      throw await result.json();
    }
    const data = GetInitialGraphDtoSchema.parse(await result.json());
    return data;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
