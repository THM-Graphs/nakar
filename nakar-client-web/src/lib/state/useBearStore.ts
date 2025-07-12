import { create } from "zustand/react";
import { BearState } from "./BearState.ts";
import { immer } from "zustand/middleware/immer";
import { SocketState } from "../ws/SocketState.ts";
import { PhysicsPerformance, WSEventProgress } from "../../../src-gen";
import { devtools } from "zustand/middleware";
import { v4 } from "uuid";
import { match, P } from "ts-pattern";
import { enableMapSet } from "immer";

enableMapSet();

export const useBearStore = create<BearState>()(
  devtools(
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
            notifications: [],
            pushNotification: (notification) => {
              set((s) => {
                const id = v4();
                s.room.ui.notifications = [
                  ...s.room.ui.notifications,
                  {
                    id: id,
                    message: notification.message,
                    date: notification.date,
                    severity: notification.severity,
                    title: notification.title,
                  },
                ];

                setTimeout(() => {
                  useBearStore.getState().room.ui.removeNotification(id);
                }, 5000);
              });
            },
            pushErrorNotification: (error: unknown) => {
              useBearStore.getState().room.ui.pushNotification({
                title: "Error",
                message: match(error)
                  .with(P.string, (e) => e)
                  .with(P.instanceOf(Error), (e) => e.message)
                  .otherwise(() => JSON.stringify(error)),
                date: new Date(),
                severity: "error",
              });
            },
            removeNotification: (id: string) => {
              set((s) => {
                s.room.ui.notifications = s.room.ui.notifications.filter(
                  (n) => n.id !== id,
                );
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
                histogram: {
                  nodeLabels: [],
                  edgeTypes: [],
                  edgeProperties: [],
                  nodeProperties: [],
                  nodes: [],
                },
              },
              table: {
                data: [],
              },
              metaData: {
                pipelineSummary: [],
                scenario: null,
                arguments: [],
                canUndo: false,
                canRedo: false,
              },
            },
            setGraph: (graph) => {
              set((s) => {
                s.room.scenario.graph = graph;
              });
            },
            setGraphMetaData: (metaData) => {
              set((s) => {
                s.room.scenario.graph.metaData = metaData;
              });
            },
            setGraphTable: (table) => {
              set((s) => {
                s.room.scenario.graph.table = table;
              });
            },
            setGraphElements: (graphElements) => {
              set((s) => {
                s.room.scenario.graph.elements = graphElements;
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
            runScenarioModal: {
              shown: false,
              scenario: null,
              arguments: [],
              setArgumentValue: (identifier, value) => {
                set((s) => {
                  s.room.scenario.runScenarioModal.arguments =
                    s.room.scenario.runScenarioModal.arguments.map((arg) => {
                      if (arg.identifier === identifier) {
                        return {
                          ...arg,
                          value: value,
                        };
                      } else {
                        return arg;
                      }
                    });
                });
              },
              open: (scenario, firstArgument) => {
                set((s) => {
                  s.room.scenario.runScenarioModal.shown = true;
                  s.room.scenario.runScenarioModal.scenario = scenario;
                  for (const parameter of scenario.parameters) {
                    s.room.scenario.runScenarioModal.arguments.push({
                      identifier: parameter.identifier,
                      value:
                        scenario.parameters[0] === parameter
                          ? (firstArgument ?? parameter.defaultValue ?? "")
                          : (parameter.defaultValue ?? ""),
                    });
                  }
                });
              },
              close: () => {
                set((s) => {
                  s.room.scenario.runScenarioModal.shown = false;
                });
              },
              clean: () => {
                set((s) => {
                  s.room.scenario.runScenarioModal.arguments = [];
                  s.room.scenario.runScenarioModal.scenario = null;
                });
              },
            },
            expandNodePreview: {
              shown: false,
              data: null,
              open: (data) => {
                set((s) => {
                  s.room.scenario.expandNodePreview.data = {
                    nodeId: data.nodeId,
                    labels: data.labels,
                    relationships: data.relationships,
                    selectedLabels: new Set(),
                    selectedRelationships: new Set(),
                  };
                  s.room.scenario.expandNodePreview.shown = true;
                });
              },
              close: () => {
                set((s) => {
                  s.room.scenario.expandNodePreview.shown = false;
                });
              },
              clean: () => {
                set((s) => {
                  s.room.scenario.expandNodePreview.data = null;
                });
              },
              setSelectedRelationships: (element, selected) => {
                set((s) => {
                  const data = s.room.scenario.expandNodePreview.data;
                  if (!data) {
                    return;
                  }
                  if (selected) {
                    data.selectedRelationships.add(element.identificator);
                  } else {
                    data.selectedRelationships.delete(element.identificator);
                  }
                });
              },
              setSelectedLabel: (element, selected) => {
                set((s) => {
                  const data = s.room.scenario.expandNodePreview.data;
                  if (!data) {
                    return;
                  }
                  if (selected) {
                    data.selectedLabels.add(element.identificator);
                  } else {
                    data.selectedLabels.delete(element.identificator);
                  }
                });
              },
            },
          },
          panels: {
            left: "scenarios",
            right: null,
            inspector: {
              element: null,
              setElement: (i) => {
                set((s) => {
                  s.room.panels.inspector.element = i;
                  s.room.panels.right = "inspector";
                });
              },
              removeElement: () => {
                set((s) => {
                  s.room.panels.inspector.element = null;
                });
              },
              show: () => {
                set((s) => {
                  s.room.panels.right = "inspector";
                });
              },
              hide: () => {
                set((s) => {
                  s.room.panels.right = null;
                  s.room.panels.inspector.element = null;
                });
              },
            },
            histogram: {
              show: () => {
                set((s) => {
                  s.room.panels.right = "histogram";
                });
              },
              hide: () => {
                set((s) => {
                  s.room.panels.right = null;
                });
              },
            },
            scenarios: {
              scenarios: { scenarioGroups: [] },
              setScenarios: (scenarios) => {
                set((s) => {
                  s.room.panels.scenarios.scenarios = scenarios;
                });
              },
              show: () => {
                set((s) => {
                  s.room.panels.left = "scenarios";
                });
              },
              hide: () => {
                set((s) => {
                  s.room.panels.left = null;
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
  ),
);
