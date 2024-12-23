import { GetInitialGraphDto, GetScenariosDto } from "../shared/dto.ts";

export const _baseUrl = "http://localhost:1337";

export const getScenarios = async (): Promise<GetScenariosDto> => {
  const result = await fetch(`${baseUrl()}/api/frontend/scenarios`);
  if (!result.ok) {
    throw new Error(await result.text());
  }
  const data = (await result.json()) as GetScenariosDto;
  return data;
};

export const getInitialGraph = async (
  scnenarioId: string,
): Promise<GetInitialGraphDto> => {
  const result = await fetch(
    `${baseUrl()}/api/frontend/initial-graph?scenarioId=${scnenarioId}`,
  );
  if (!result.ok) {
    throw new Error(await result.text());
  }
  const data = (await result.json()) as GetInitialGraphDto;
  return data;
};

export const baseUrl = (): string => {
  return _baseUrl;
};
