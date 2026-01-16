import { create } from "zustand/react";
import { BearState } from "./BearState.ts";
import { SocketState } from "../shared/ws/SocketState.ts";
import {
  devtools,
  persist,
  PersistOptions,
  subscribeWithSelector,
} from "zustand/middleware";
import { v4 } from "uuid";
import { match, P } from "ts-pattern";
import { enableMapSet } from "immer";
import { Subject } from "rxjs";
import { immer } from "zustand/middleware/immer";
import { ColorSchema } from "../room/color/ColorSchema.ts";
import { UserTheme } from "../shared/theme/UserTheme.ts";
import { Theme } from "../shared/theme/Theme.ts";
import { loadSystemTheme } from "../shared/theme/ThemeManager.ts";
import { PersistStorage } from "./PersistStorage.ts";
import { SelectedCanvasTab } from "./SelectedCanvasTab.ts";
import { ZoomTransform } from "d3";
import {
  ColorDto,
  LiveCanvasViewSettingsDto,
  NodeLockCollectionEntryDto,
  NodePreviewDto,
  NoteDto,
} from "../../src-gen";

enableMapSet();

export const useBearStore = create<BearState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer(
          (set, get): BearState => ({
            global: {
              auth: {
                jwt: null,
                setJWT: (jwt: string | null) => {
                  set((s) => {
                    s.global.auth.jwt = jwt;
                  });
                },
                username: null,
                setUsername: (username: string | null) => {
                  set((s) => {
                    s.global.auth.username = username;
                  });
                },
                loginWindow: {
                  password: "",
                  setPassword: (pw) => {
                    set((s) => {
                      s.global.auth.loginWindow.password = pw;
                    });
                  },
                  username: "",
                  setUsername: (username) => {
                    set((s) => {
                      s.global.auth.loginWindow.username = username;
                    });
                  },
                  hide: () => {
                    set((s) => {
                      s.global.auth.loginWindow.shown = false;
                      s.global.auth.loginWindow.username = "";
                      s.global.auth.loginWindow.password = "";
                    });
                  },
                  show: () => {
                    set((s) => {
                      s.global.auth.loginWindow.shown = true;
                    });
                  },
                  shown: false,
                },
              },
              theme: {
                user: null,
                system: loadSystemTheme(),
                setUserTheme: (userTheme: UserTheme) => {
                  set((s) => {
                    s.global.theme.user = userTheme;
                  });
                },
                setSystemTheme: (systemTheme: Theme) => {
                  set((s) => {
                    s.global.theme.system = systemTheme;
                  });
                },
                getTheme: (): Theme => {
                  return get().global.theme.user ?? get().global.theme.system;
                },
              },
            },
            start: {
              myRooms: [],
              addRoom: (roomId: string) => {
                set((s) => {
                  if (s.start.myRooms.includes(roomId)) {
                    s.start.myRooms = s.start.myRooms.filter(
                      (r) => r !== roomId,
                    );
                  }
                  s.start.myRooms = [roomId, ...s.start.myRooms];
                });
              },
              removeRoom: (roomId: string) => {
                set((s) => {
                  s.start.myRooms = s.start.myRooms.filter((r) => r !== roomId);
                });
              },
            },
            room: {
              ui: {
                progress: null,
                setProgress: (p) => {
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
                setPerformance: (performance) => {
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
                      },
                    ];

                    setTimeout(() => {
                      useBearStore.getState().room.ui.removeNotification(id);
                    }, 5000);
                  });
                },
                pushErrorNotification: (error: unknown) => {
                  useBearStore.getState().room.ui.pushNotification({
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
                rendererEvents: {
                  onZoomIn: new Subject<void>(),
                  onZoomOut: new Subject<void>(),
                  onCenter: new Subject<void>(),
                  onZoomOutOverview: new Subject<void>(),
                  onShowNodeContextMenu: new Subject<{
                    nodeId: string;
                    position: [number, number];
                  }>(),
                  onShowEdgeContextMenu: new Subject<{
                    edgeId: string;
                    position: [number, number];
                  }>(),
                },
              },
              websockets: {
                state: { type: "disconnected" },
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
                  histogram: {
                    nodeLabels: [],
                    edgeTypes: [],
                    edgeProperties: [],
                    nodeProperties: [],
                    nodes: [],
                  },
                  notes: [],
                  metaData: {
                    scenario: null,
                    arguments: [],
                    undoAction: null,
                    redoAction: null,
                  },
                  viewSettings: {
                    compressRelationshipsWidthFactor: 0,
                    growNodesBasedOnDegree: false,
                    growNodesBasedOnDegreeFactor: 0,
                  },
                },
                setGraph: (graph) => {
                  set((s) => {
                    if (graph == null) {
                      s.room.scenario.graph = {
                        elements: {
                          nodes: [],
                          labels: [],
                          edges: [],
                        },
                        metaData: {
                          arguments: [],
                          undoAction: null,
                          redoAction: null,
                          scenario: null,
                        },
                        notes: [],
                        histogram: {
                          edgeProperties: [],
                          edgeTypes: [],
                          nodeLabels: [],
                          nodeProperties: [],
                          nodes: [],
                        },
                        table: {
                          data: [],
                        },
                        viewSettings: {
                          compressRelationshipsWidthFactor: 0,
                          growNodesBasedOnDegree: false,
                          growNodesBasedOnDegreeFactor: 0,
                        },
                      };
                    } else {
                      s.room.scenario.graph = graph;
                    }
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
                setHistogram: (histogram) => {
                  set((s) => {
                    s.room.scenario.graph.histogram = histogram;
                  });
                },
                setNotes: (notes) => {
                  set((s) => {
                    s.room.scenario.graph.notes = notes;
                  });
                },
                setLocks: (locks: NodeLockCollectionEntryDto[]) => {
                  set((s) => {
                    for (const node of locks) {
                      const localNode =
                        s.room.scenario.graph.elements.nodes.find(
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
                  additive: false,
                  scenario: null,
                  arguments: [],
                  setArgumentValue: (identifier, value) => {
                    set((s) => {
                      s.room.scenario.runScenarioModal.arguments =
                        s.room.scenario.runScenarioModal.arguments.map(
                          (arg) => {
                            if (arg.identifier === identifier) {
                              return {
                                ...arg,
                                value: value,
                              };
                            } else {
                              return arg;
                            }
                          },
                        );
                    });
                  },
                  open: (scenario, scenarioArguments, additive: boolean) => {
                    set((s) => {
                      s.room.scenario.runScenarioModal.shown = true;
                      s.room.scenario.runScenarioModal.scenario = scenario;
                      s.room.scenario.runScenarioModal.additive = additive;
                      for (const parameter of scenario.parameters) {
                        const providedArgument = scenarioArguments.find(
                          (a) => a.identifier === parameter.identifier,
                        );
                        s.room.scenario.runScenarioModal.arguments.push({
                          identifier: parameter.identifier,
                          value: providedArgument
                            ? providedArgument.value
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
                      s.room.scenario.expandNodePreview.data = data
                        ? {
                            nodeId: data.nodeId,
                            labels: data.labels,
                            relationships: data.relationships,
                            selectedLabels: new Set(),
                            selectedRelationships: new Set(),
                          }
                        : null;
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
                        data.selectedRelationships.delete(
                          element.identificator,
                        );
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
                  element: [],
                  setElement: (i) => {
                    set((s) => {
                      s.room.panels.inspector.element = [i];
                      s.room.panels.right = "inspector";
                    });
                  },
                  setElements: (i) => {
                    set((s) => {
                      s.room.panels.inspector.element = i;
                      s.room.panels.right = "inspector";
                    });
                  },
                  appendElement: (i) => {
                    set((s) => {
                      const elements = get().room.panels.inspector.element;
                      if (elements.includes(i)) {
                        s.room.panels.inspector.element = elements.filter(
                          (a) => a !== i,
                        );
                      } else {
                        s.room.panels.inspector.element = [...elements, i];
                      }
                      s.room.panels.right = "inspector";
                    });
                  },
                  deselectElements: () => {
                    set((s) => {
                      s.room.panels.inspector.element = [];
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
                      s.room.panels.inspector.element = [];
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
                  scenarios: {
                    scenarioGroups: [],
                    parameterizedScenarios: [],
                    referencedDatabases: [],
                  },
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
                query: {
                  queryText: "",
                  show: () => {
                    set((s) => {
                      s.room.panels.left = "query";
                    });
                  },
                  hide: () => {
                    set((s) => {
                      s.room.panels.left = null;
                    });
                  },
                  setQueryText: (q) => {
                    set((s) => {
                      s.room.panels.query.queryText = q;
                    });
                  },
                },
                notes: {
                  show: () => {
                    set((s) => {
                      s.room.panels.left = "notes";
                    });
                  },
                  hide: () => {
                    set((s) => {
                      s.room.panels.left = null;
                    });
                  },
                  addNoteModal: {
                    shown: false,
                    showForCreate: (nodes) => {
                      set((s) => {
                        s.room.panels.notes.addNoteModal.shown = true;
                        s.room.panels.notes.addNoteModal.nodes = nodes.map(
                          (n) =>
                            ({
                              id: n.id,
                              title: n.title,
                              labels: n.labels,
                              customColor: null,
                            }) satisfies NodePreviewDto,
                        );
                        s.room.panels.notes.addNoteModal.noteId = null;
                      });
                    },
                    showForUpdate: (note: NoteDto) => {
                      set((s) => {
                        s.room.panels.notes.addNoteModal.shown = true;
                        s.room.panels.notes.addNoteModal.nodes = [
                          ...note.nodes,
                        ];
                        s.room.panels.notes.addNoteModal.noteId = note.id;
                        s.room.panels.notes.addNoteModal.content = note.content;
                        s.room.panels.notes.addNoteModal.color =
                          note.color ?? null;
                      });
                    },
                    close: () => {
                      set((s) => {
                        s.room.panels.notes.addNoteModal.shown = false;
                      });
                    },
                    clean: () => {
                      set((s) => {
                        s.room.panels.notes.addNoteModal.nodes = [];
                        s.room.panels.notes.addNoteModal.content = "";
                        s.room.panels.notes.addNoteModal.noteId = null;
                        s.room.panels.notes.addNoteModal.color = null;
                      });
                    },
                    nodes: [],
                    content: "",
                    noteId: null,
                    setContent: (c: string) => {
                      set((s) => {
                        s.room.panels.notes.addNoteModal.content = c;
                      });
                    },
                    color: null,
                    setColor: (c: ColorDto | null) => {
                      set((s) => {
                        s.room.panels.notes.addNoteModal.color = c;
                      });
                    },
                  },
                },
                search: {
                  searchTerm: "",
                  show: () => {
                    set((s) => {
                      s.room.panels.left = "search";
                    });
                  },
                  hide: () => {
                    set((s) => {
                      s.room.panels.left = null;
                    });
                  },
                  setSearchTerm: (q) => {
                    set((s) => {
                      s.room.panels.search.searchTerm = q;
                    });
                  },
                },
                visualization: {
                  show: () => {
                    set((s) => {
                      s.room.panels.right = "visualization";
                    });
                  },
                  hide: () => {
                    set((s) => {
                      s.room.panels.right = null;
                    });
                  },
                  setData: (newValue: LiveCanvasViewSettingsDto) => {
                    set((s) => {
                      s.room.scenario.graph.viewSettings = newValue;
                    });
                  },
                  setCompressRelationshipsWidthFactor: (newValue: number) => {
                    set((s) => {
                      s.room.scenario.graph.viewSettings.compressRelationshipsWidthFactor =
                        newValue;
                    });
                  },
                  setGrowNodesBasedOnDegree: (newValue: boolean) => {
                    set((s) => {
                      s.room.scenario.graph.viewSettings.growNodesBasedOnDegree =
                        newValue;
                    });
                  },
                  setGrowNodesBasedOnDegreeFactor: (newValue: number) => {
                    set((s) => {
                      s.room.scenario.graph.viewSettings.growNodesBasedOnDegreeFactor =
                        newValue;
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
                    });
                  },
                  selectData: () => {
                    set((s) => {
                      s.room.canvas.tabs.selected = "data";
                    });
                  },
                },
                hideLabels: false,
                setHideLabels: (hideLabels: boolean) => {
                  set((s) => {
                    s.room.canvas.hideLabels = hideLabels;
                  });
                },
                colorSchemaSlug: ColorSchema.allColorSchema()[0].slug,
                setColorSchema: (newSchema: string) => {
                  set((s) => {
                    s.room.canvas.colorSchemaSlug = newSchema;
                  });
                },
                zoomTransform: new ZoomTransform(1, 0, 0),
                setZoomTransform: (zoomTransform: ZoomTransform) => {
                  set((s) => {
                    s.room.canvas.zoomTransform = zoomTransform;
                  });
                },
              },
            },
          }),
        ),
      ),
      {
        name: "state",
        partialize: (s): PersistStorage => ({
          hideLabels: s.room.canvas.hideLabels,
          userTheme: s.global.theme.user,
          selectedCanvasTab: s.room.canvas.tabs.selected,
          leftPanel: s.room.panels.left,
          rightPanel: s.room.panels.right,
          colorSchema: s.room.canvas.colorSchemaSlug,
          canvasZoom: s.room.canvas.zoomTransform.k,
          canvasTransformX: s.room.canvas.zoomTransform.x,
          canvasTransformY: s.room.canvas.zoomTransform.y,
          jwt: s.global.auth.jwt,
          myRooms: s.start.myRooms,
        }),
        merge: (rawStorage: unknown, state: BearState): BearState => {
          const storage: PersistStorage = rawStorage as PersistStorage;
          state.room.canvas.hideLabels = storage.hideLabels ?? false;
          state.global.theme.user = match(storage.userTheme)
            .returnType<UserTheme>()
            .with("light", () => "light")
            .with("dark", () => "dark")
            .otherwise(() => null);
          state.room.canvas.tabs.selected = match(storage.selectedCanvasTab)
            .returnType<SelectedCanvasTab>()
            .with("data", () => "data")
            .otherwise(() => "graph");
          state.room.panels.left = match(storage.leftPanel)
            .returnType<"scenarios" | "query" | "notes" | "search" | null>()
            .with("scenarios", () => "scenarios")
            .with("query", () => "query")
            .with("notes", () => "notes")
            .with("search", () => "search")
            .otherwise(() => null);
          state.room.panels.right = match(storage.rightPanel)
            .returnType<"histogram" | "inspector" | "visualization" | null>()
            .with("histogram", () => "histogram")
            .with("inspector", () => "inspector")
            .with("visualization", () => "visualization")
            .otherwise(() => null);
          state.room.canvas.colorSchemaSlug =
            storage.colorSchema ?? ColorSchema.default().slug;
          state.room.canvas.zoomTransform = new ZoomTransform(
            storage.canvasZoom ?? 1,
            storage.canvasTransformX ?? 0,
            storage.canvasTransformY ?? 0,
          );
          state.global.auth.jwt = storage.jwt;
          state.start.myRooms = storage.myRooms ?? [];
          return state;
        },
        onRehydrateStorage: () => {
          return (state, error) => {
            if (error) {
              console.error("an error happened during hydration", error);
            }
          };
        },
        version: 0,
      } satisfies PersistOptions<BearState, PersistStorage>,
    ),
  ),
);
