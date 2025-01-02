import { GetInitialGraphDto, GetScenariosDto } from "../../shared/dto.ts";

export interface IState {
  scenariosWindow: {
    opened: boolean;
    scenarios:
      | {
          type: "loading";
        }
      | {
          type: "error";
          message: string;
        }
      | {
          type: "data";
          data: GetScenariosDto;
        };
  };
  canvas: {
    graph: GetInitialGraphDto;
    tableDataOpened: boolean;
  };
}
