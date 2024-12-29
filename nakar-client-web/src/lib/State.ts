import { create } from "zustand";
import { GetInitialGraphDto, GetScenariosDto } from "../shared/dto.ts";
import { immer } from "zustand/middleware/immer";
import { getInitialGraph, getScenarios, HTTPError } from "./Backend.ts";
import { handleError } from "./ErrorHandling.ts";

interface BearState {
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

export const useBearStore = create<BearState>()(
  immer(
    (): BearState => ({
      scenariosWindow: {
        opened: true,
        scenarios: {
          type: "loading",
        },
      },
      canvas: {
        graph: {
          graph: {
            nodes: [],
            edges: [],
          },
          graphMetaData: {
            labels: [],
          },
          tableData: [],
        },
        tableDataOpened: false,
      },
    }),
  ),
);

export const actions = {
  scenariosWindow: {
    reloadScenarios: (): void => {
      (async () => {
        try {
          useBearStore.setState((state: BearState): void => {
            state.scenariosWindow.scenarios = { type: "loading" };
          });
          const data = await getScenarios();
          useBearStore.setState((state: BearState): void => {
            state.scenariosWindow.scenarios = { type: "data", data: data };
          });
        } catch (error: unknown) {
          useBearStore.setState((state: BearState): void => {
            state.scenariosWindow.scenarios = {
              type: "error",
              message: handleError(error),
            };
          });
        }
      })().catch(console.error);
    },
    toggleWindow: (): void => {
      useBearStore.setState((state: BearState): void => {
        state.scenariosWindow.opened = !state.scenariosWindow.opened;
      });
    },
  },
  canvas: {
    loadInitialGraph: (scenarioId: string): void => {
      (async () => {
        try {
          const result: GetInitialGraphDto = await getInitialGraph(scenarioId);
          useBearStore.setState((state: BearState): void => {
            state.canvas.graph = result;
          });
        } catch (error) {
          const httpError = error as HTTPError;
          alert(`${httpError.name}\n\n${httpError.message}`);
        }
      })().catch(console.error);
    },
    toggleDataWindow: () => {
      useBearStore.setState((state: BearState): void => {
        state.canvas.tableDataOpened = !state.canvas.tableDataOpened;
      });
    },
  },
};
