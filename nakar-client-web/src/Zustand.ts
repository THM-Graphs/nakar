import { create } from "zustand";
import { GetScenariosDto } from "./shared/dto.ts";
import { immer } from "zustand/middleware/immer";

interface BearState {
  scenariosWindow: {
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
}

interface BearActions {
  scenariosWindow: {
    setScenarios: (data: GetScenariosDto) => void;
    setError: (message: string) => void;
    setLoading: () => void;
  };
}

export const useBearStore = create<BearState & BearActions>()(
  immer((set) => ({
    scenariosWindow: {
      scenarios: {
        type: "loading",
      },
      setScenarios: (data: GetScenariosDto): void => {
        set((state: BearState): void => {
          state.scenariosWindow.scenarios = { type: "data", data: data };
        });
      },
      setError: (message: string): void => {
        set((state: BearState): void => {
          state.scenariosWindow.scenarios = { type: "error", message: message };
        });
      },
      setLoading: (): void => {
        set((state: BearState): void => {
          state.scenariosWindow.scenarios = { type: "loading" };
        });
      },
    },
  })),
);
