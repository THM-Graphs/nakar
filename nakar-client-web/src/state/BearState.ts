import {
  CanvasViewSettings,
  Color,
  ExpandNodePreviewElement,
  GetScenariosResult,
  Graph,
  GraphElements,
  GraphMetaData,
  GraphTable,
  Node,
  NodePreview,
  Note,
  Notification,
  PhysicsPerformance,
  Scenario,
  ScenarioArgument,
  WSEventProgress,
} from "../../src-gen";
import { SocketState } from "../shared/ws/SocketState.ts";
import { Subject } from "rxjs";
import { UserTheme } from "../shared/theme/UserTheme.ts";
import { Theme } from "../shared/theme/Theme.ts";
import { SelectedCanvasTab } from "./SelectedCanvasTab.ts";
import { ZoomTransform } from "d3";

export interface BearState {
  global: {
    auth: {
      jwt: string | null;
      setJWT: (jwt: string | null) => void;
      username: string | null;
      setUsername: (username: string | null) => void;
      loginWindow: {
        shown: boolean;
        username: string;
        setUsername: (username: string) => void;
        password: string;
        setPassword: (password: string) => void;
        show: () => void;
        hide: () => void;
      };
    };
    theme: {
      user: UserTheme;
      system: Theme;
      setUserTheme: (theme: UserTheme) => void;
      setSystemTheme: (theme: Theme) => void;
      getTheme: () => Theme;
    };
  };
  start: {
    myRooms: string[];
    addRoom: (roomId: string) => void;
    removeRoom: (roomId: string) => void;
  };
  room: {
    ui: {
      progress: WSEventProgress | null;
      setProgress: (progress: WSEventProgress) => void;
      clearProgress: () => void;
      performance: PhysicsPerformance | null;
      setPerformance: (performance: PhysicsPerformance | null) => void;
      clearPerformance: () => void;
      notifications: Array<
        {
          id: string;
          date: Date;
        } & Omit<Notification, "date">
      >;
      pushNotification: (
        notification: {
          date: Date;
        } & Omit<Notification, "date">,
      ) => void;
      pushErrorNotification: (error: unknown) => void;
      removeNotification: (id: string) => void;
      rendererEvents: {
        onZoomIn: Subject<void>;
        onZoomOut: Subject<void>;
        onCenter: Subject<void>;
        onZoomOutOverview: Subject<void>;
        onShowNodeContextMenu: Subject<{
          nodeId: string;
          position: [number, number];
        }>;
        onShowEdgeContextMenu: Subject<{
          edgeId: string;
          position: [number, number];
        }>;
      };
    };
    scenario: {
      graph: Graph;
      setGraph: (g: Graph | null) => void;
      setGraphElements: (g: GraphElements) => void;
      setGraphMetaData: (g: GraphMetaData) => void;
      setGraphTable: (g: GraphTable) => void;
      setLocks: (locks: { id: string; locked: boolean }[]) => void;
      runScenarioModal: {
        shown: boolean;
        scenario: Scenario | null;
        arguments: ScenarioArgument[];
        additive: boolean;
        setArgumentValue: (identifier: string, value: string) => void;
        open: (
          scenario: Scenario,
          scenarioArguments: ScenarioArgument[],
          additive: boolean,
        ) => void;
        close: () => void;
        clean: () => void;
      };
      expandNodePreview: {
        shown: boolean;
        data: {
          relationships: ExpandNodePreviewElement[];
          labels: ExpandNodePreviewElement[];
          nodeId: string;
          selectedRelationships: Set<string>;
          selectedLabels: Set<string>;
        } | null;
        open: (
          data: {
            relationships: ExpandNodePreviewElement[];
            labels: ExpandNodePreviewElement[];
            nodeId: string;
          } | null,
        ) => void;
        close: () => void;
        clean: () => void;
        setSelectedRelationships: (
          element: ExpandNodePreviewElement,
          selected: boolean,
        ) => void;
        setSelectedLabel: (
          element: ExpandNodePreviewElement,
          selected: boolean,
        ) => void;
      };
    };
    websockets: {
      state: SocketState;
      setState: (state: SocketState) => void;
    };
    panels: {
      left: "scenarios" | "query" | "notes" | "search" | null;
      right: "histogram" | "inspector" | "visualization" | null;
      inspector: {
        show: () => void;
        hide: () => void;
        element: string[];
        setElement: (i: string) => void;
        setElements: (i: string[]) => void;
        appendElement: (i: string) => void;
        deselectElements: () => void;
      };
      histogram: {
        show: () => void;
        hide: () => void;
      };
      scenarios: {
        scenarios: GetScenariosResult;
        setScenarios: (scenarios: GetScenariosResult) => void;
        show: () => void;
        hide: () => void;
      };
      query: {
        queryText: string;
        show: () => void;
        hide: () => void;
        setQueryText: (queryText: string) => void;
      };
      notes: {
        show: () => void;
        hide: () => void;
        addNoteModal: {
          shown: boolean;
          showForCreate: (nodes: Node[]) => void;
          showForUpdate: (note: Note) => void;
          close: () => void;
          clean: () => void;
          noteId: string | null;
          nodes: NodePreview[];
          content: string;
          setContent: (c: string) => void;
          color: Color | null;
          setColor: (c: Color | null) => void;
        };
      };
      search: {
        searchTerm: string;
        show: () => void;
        hide: () => void;
        setSearchTerm: (queryText: string) => void;
      };
      visualization: {
        show: () => void;
        hide: () => void;
        setCompressRelationshipsWidthFactor: (newValue: number) => void;
        setGrowNodesBasedOnDegree: (newValue: boolean) => void;
        setGrowNodesBasedOnDegreeFactor: (newValue: number) => void;
        setData: (newValue: CanvasViewSettings) => void;
        data: CanvasViewSettings | null;
      };
    };
    canvas: {
      tabs: {
        selected: SelectedCanvasTab;
        selectGraph: () => void;
        selectData: () => void;
      };
      hideLabels: boolean;
      setHideLabels: (pm: boolean) => void;
      colorSchemaSlug: string;
      setColorSchema: (newSchemaSlug: string) => void;
      zoomTransform: ZoomTransform;
      setZoomTransform: (zoomTransform: ZoomTransform) => void;
    };
  };
}
