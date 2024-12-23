import { create } from "zustand";
import { GetInitialGraphDto, GetScenariosDto } from "../shared/dto.ts";
import { immer } from "zustand/middleware/immer";
import { getInitialGraph, getScenarios } from "./Backend.ts";
import { handleError } from "./ErrorHandling.ts";
import { bindLogicalPositionIntoParent } from "./Draggable.ts";
import { getRandomColor, invertColor } from "./Color.ts";

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
    graph: {
      nodes: Array<{
        id: string;
        displayTitle: string;
        position: {
          x: number;
          y: number;
        };
        backgroundColor: string;
        displayTitleColor: string;
        size: number;
      }>;
      edges: Array<{
        id: string;
        nodeIdStart: string;
        nodeIdEnd: string;
      }>;
    };
    moveNodePosition: (
      nodeId: string,
      deltaPosition: { x: number; y: number },
      selfHandle: HTMLDivElement,
      parentHandle: HTMLDivElement,
    ) => void;
  };
}

interface BearActions {
  scenariosWindow: {
    reloadScenarios: () => void;
    toggleWindow: () => void;
  };
  canvas: {
    loadInitialGraph: (scenarioId: string) => void;
  };
}

export const useBearStore = create<BearState & BearActions>()(
  immer((set): BearState & BearActions => ({
    scenariosWindow: {
      opened: true,
      scenarios: {
        type: "loading",
      },
      reloadScenarios: (): void => {
        (async () => {
          try {
            set((state: BearState): void => {
              state.scenariosWindow.scenarios = { type: "loading" };
            });
            const data = await getScenarios();
            set((state: BearState): void => {
              state.scenariosWindow.scenarios = { type: "data", data: data };
            });
          } catch (error: unknown) {
            set((state: BearState): void => {
              state.scenariosWindow.scenarios = {
                type: "error",
                message: handleError(error),
              };
            });
          }
        })().catch(console.error);
      },
      toggleWindow: (): void => {
        set((state: BearState): void => {
          state.scenariosWindow.opened = !state.scenariosWindow.opened;
        });
      },
    },
    canvas: {
      graph: {
        nodes: [],
        edges: [],
      },
      loadInitialGraph: (scenarioId): void => {
        (async () => {
          const result: GetInitialGraphDto = await getInitialGraph(scenarioId);
          set((state: BearState): void => {
            state.canvas.graph = {
              nodes: result.graph.nodes.map((node) => {
                const backgroundColor = getRandomColor();
                return {
                  id: node.id,
                  displayTitle: node.displayTitle,
                  position: {
                    x: Math.round(Math.random() * 800),
                    y: Math.round(Math.random() * 800),
                  },
                  backgroundColor: backgroundColor,
                  size: 100 * (1 - Math.random() * 0.5),
                  displayTitleColor: invertColor(backgroundColor),
                };
              }),
              edges: result.graph.edges.map((edge) => {
                return {
                  id: edge.id,
                  nodeIdStart: edge.startNodeId,
                  nodeIdEnd: edge.endNodeId,
                };
              }),
            };
          });
        })().catch(console.error);
      },
      moveNodePosition: (
        nodeId: string,
        deltaPosition: { x: number; y: number },
        selfHandle: HTMLDivElement,
        parentHandle: HTMLDivElement,
      ) => {
        set((state: BearState): void => {
          state.canvas.graph.nodes = state.canvas.graph.nodes.map((node) => {
            if (node.id === nodeId) {
              node.position = bindLogicalPositionIntoParent(
                {
                  x: node.position.x + deltaPosition.x,
                  y: node.position.y + deltaPosition.y,
                },
                parentHandle,
                selfHandle,
                true,
              );
            }
            return node;
          });
        });
      },
    },
  })),
);
