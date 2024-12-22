import { create } from "zustand/react";
import { GetScenariosDto } from "./server-dto/GetScenariosDto.ts";

interface BearState {
  scenariosWindow: {
    scenarios:
      | {
          type: "loading";
        }
      | {
          type: "data";
          data: GetScenariosDto;
        };
    setScenarios: (data: GetScenariosDto) => void;
  };
}

export const useBearStore = create<BearState>()((set) => ({
  scenariosWindow: {
    scenarios: {
      type: "loading",
    },
    setScenarios: (data) => {
      set((state) => {
        return {
          scenariosWindow: {
            ...state.scenariosWindow,
            scenarios: { type: "data", data: data },
          },
        };
      });
    },
  },
}));
