import {
  ExpandNodePreviewElement,
  GetScenariosResult,
  Graph,
  GraphElements,
  GraphMetaData,
  GraphTable,
  Notification,
  PhysicsPerformance,
  Scenario,
  ScenarioArgument,
  WSEventProgress,
} from "../../../src-gen";
import { SocketState } from "../ws/SocketState.ts";
import { Subject } from "rxjs";
import { UserTheme } from "../theme/UserTheme.ts";
import { Theme } from "../theme/Theme.ts";
import { SelectedCanvasTab } from "./SelectedCanvasTab.ts";
import { ZoomTransform } from "d3";

export interface BearState {
  global: {
    theme: {
      user: UserTheme;
      system: Theme;
      setUserTheme: (theme: UserTheme) => void;
      setSystemTheme: (theme: Theme) => void;
      getTheme: () => Theme;
    };
  };
  room: {
    ui: {
      locked: boolean;
      lock: () => void;
      unlock: () => void;
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
      };
    };
    scenario: {
      graph: Graph;
      setGraph: (g: Graph) => void;
      setGraphElements: (g: GraphElements) => void;
      setGraphMetaData: (g: GraphMetaData) => void;
      setGraphTable: (g: GraphTable) => void;
      setLocks: (locks: { id: string; locked: boolean }[]) => void;
      runScenarioModal: {
        shown: boolean;
        scenario: Scenario | null;
        arguments: ScenarioArgument[];
        setArgumentValue: (identifier: string, value: string) => void;
        open: (scenario: Scenario, firstArgument: string | null) => void;
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
      left: "scenarios" | "query" | null;
      right: "histogram" | "inspector" | null;
      inspector: {
        show: () => void;
        hide: () => void;
        element: string[];
        setElement: (i: string) => void;
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
