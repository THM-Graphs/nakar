import { create } from "zustand/react";
import { BearState } from "./BearState.ts";
import { immer } from "zustand/middleware/immer";
import { SocketState } from "../ws/SocketState.ts";
import { PhysicsPerformance, WSEventProgress } from "../../../src-gen";

export const useBearStore = create<BearState>()(
  immer(
    (set): BearState => ({
      room: {
        ui: {
          locked: false,
          lock: () => {
            set((s) => {
              s.room.ui.locked = true;
            });
          },
          unlock: () => {
            set((s) => {
              s.room.ui.locked = false;
            });
          },
          progress: null,
          setProgress: (p: WSEventProgress) => {
            set((s) => {
              s.room.ui.progress = p;
            });
          },
          clearProgress: () => {
            set((s) => {
              s.room.ui.progress = null;
            });
          },
          performance: null,
          setPerformance: (performance: PhysicsPerformance | null) => {
            set((s) => {
              s.room.ui.performance = performance;
            });
          },
          clearPerformance: () => {
            set((s) => {
              s.room.ui.performance = null;
            });
          },
        },
        websockets: {
          state: { type: "connecting" },
          setState: (state: SocketState) => {
            set((s) => {
              s.room.websockets.state = state;
            });
          },
        },
        scenario: {
          graph: {
            elements: {
              nodes: [],
              edges: [],
              labels: [],
            },
            table: {
              data: [],
            },
            metaData: {
              histogram: {
                nodeLabels: [],
                edgeTypes: [],
                edgeProperties: [],
                nodeProperties: [],
              },
              pipelineSummary: [],
              scenarioInfo: {
                id: "",
                title: null,
              },
            },
          },
          setGraph: (graph) => {
            set((s) => {
              s.room.scenario.graph = graph;
            });
          },
          setLocks: (locks: { id: string; locked: boolean }[]) => {
            set((s) => {
              for (const node of locks) {
                const localNode = s.room.scenario.graph.elements.nodes.find(
                  (n) => n.id === node.id,
                );
                if (localNode == null) {
                  continue;
                }
                localNode.locked = node.locked;
              }
            });
          },
        },
        panels: {
          inspector: {
            element: null,
            setElement: (i) => {
              set((s) => {
                s.room.panels.inspector.element = i;
                s.room.panels.inspector.shown = true;
              });
            },
            removeElement: () => {
              set((s) => {
                s.room.panels.inspector.element = null;
              });
            },
            shown: false,
            show: () => {
              set((s) => {
                s.room.panels.inspector.shown = true;
              });
            },
            hide: () => {
              set((s) => {
                s.room.panels.inspector.shown = false;
                s.room.panels.inspector.element = null;
              });
            },
          },
          histogram: {
            shown: false,
            show: () => {
              set((s) => {
                s.room.panels.histogram.shown = true;
              });
            },
            hide: () => {
              set((s) => {
                s.room.panels.histogram.shown = false;
              });
            },
          },
          scenarios: {
            scenarios: { databases: [] },
            setScenarios: (scenarios) => {
              set((s) => {
                s.room.panels.scenarios.scenarios = scenarios;
              });
            },
            shown: true,
            show: () => {
              set((s) => {
                s.room.panels.scenarios.shown = true;
              });
            },
            hide: () => {
              set((s) => {
                s.room.panels.scenarios.shown = false;
              });
            },
          },
        },
        canvas: {
          tabs: {
            selected: "graph",
            selectGraph: () => {
              set((s) => {
                s.room.canvas.tabs.selected = "graph";
                s.room.panels.inspector.element = null;
              });
            },
            selectData: () => {
              set((s) => {
                s.room.canvas.tabs.selected = "data";
                s.room.panels.inspector.element = null;
              });
            },
          },
        },
      },
    }),
  ),
);
