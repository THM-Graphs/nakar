import {
  GetInitialGraphDto,
  GetInitialGraphDtoSchema,
  GetScenariosDto,
  GetScenariosDtoSchema,
} from "../shared/dto.ts";

export const _baseUrl = "http://localhost:1337";

export const getScenarios = async (): Promise<GetScenariosDto> => {
  const result = await fetch(`${baseUrl()}/api/frontend/scenarios`);
  if (!result.ok) {
    throw await result.json();
  }
  const data = GetScenariosDtoSchema.parse(await result.json());
  return data;
};

export const getInitialGraph = async (
  scnenarioId: string,
): Promise<GetInitialGraphDto> => {
  const result = await fetch(
    `${baseUrl()}/api/frontend/initial-graph?scenarioId=${scnenarioId}`,
  );
  if (!result.ok) {
    throw await result.json();
  }
  const data = GetInitialGraphDtoSchema.parse(await result.json());
  return data;
};

export const baseUrl = (): string => {
  return _baseUrl;
};

export interface HTTPError {
  status: number;
  message: string;
  name: string;
}
