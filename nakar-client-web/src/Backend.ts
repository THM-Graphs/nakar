import { GetScenariosDto } from "./server-dto/GetScenariosDto.ts";

export const baseUrl = "http://localhost:1337";

export const getScenarios = async (): Promise<GetScenariosDto> => {
  const result = await fetch(`${baseUrl}/api/frontend/scenarios`);
  const data = (await result.json()) as GetScenariosDto;
  return data;
};
