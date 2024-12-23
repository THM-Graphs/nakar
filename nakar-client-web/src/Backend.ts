import { GetScenariosDto } from "./shared/dto";

export const baseUrl = "http://localhost:1337";

export const getScenarios = async (): Promise<GetScenariosDto> => {
  const result = await fetch(`${baseUrl}/api/frontend/scenarios`);
  if (!result.ok) {
    throw new Error(await result.text());
  }
  const data = (await result.json()) as GetScenariosDto;
  return data;
};
