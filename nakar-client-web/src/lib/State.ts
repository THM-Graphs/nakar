import { create } from "zustand";
import {
  GetInitialGraphDto,
  GetScenariosDto,
  GraphDto,
  NodeDto,
} from "../shared/dto.ts";
import { immer } from "zustand/middleware/immer";
import { getInitialGraph, getScenarios } from "./Backend.ts";
import { handleError } from "./ErrorHandling.ts";
import { Position } from "./Draggable.ts";

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
    graph: GraphDto;
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
          nodes: [],
          edges: [],
        },
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
        const result: GetInitialGraphDto = await getInitialGraph(scenarioId);
        useBearStore.setState((state: BearState): void => {
          state.canvas.graph = result.graph;
        });
      })().catch(console.error);
    },
    moveNodePosition: (nodeId: string, deltaPosition: Position) => {
      useBearStore.setState((state: BearState): void => {
        state.canvas.graph.nodes = state.canvas.graph.nodes.map(
          (node: NodeDto): NodeDto => {
            if (node.id === nodeId) {
              node.position = {
                x: node.position.x + deltaPosition.x,
                y: node.position.y + deltaPosition.y,
              };
            }
            return node;
          },
        );
      });
    },
  },
};
