import { SocketState } from "../shared/ws/SocketState.ts";
import { Subject } from "rxjs";
import { UserTheme } from "../shared/theme/UserTheme.ts";
import { Theme } from "../shared/theme/Theme.ts";
import { SelectedCanvasTab } from "./SelectedCanvasTab.ts";
import { ZoomTransform } from "d3";
import {
  ColorDto,
  ExpandNodePreviewEntryDto,
  HistogramDto,
  LiveCanvasDataDto,
  LiveCanvasGraphElementsDto,
  LiveCanvasMetaDataDto,
  LiveCanvasTableDataDto,
  LiveCanvasViewSettingsDto,
  NodeDto,
  NodeLockCollectionEntryDto,
  NodePreviewDto,
  NoteDto,
  NotificationDataDto,
  PhysicsPerformanceDto,
  ProgressWsdto,
  ScenarioArgumentDto,
  ScenarioCollectionDto,
  ScenarioDto,
} from "../../src-gen";

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
      progress: ProgressWsdto | null;
      setProgress: (progress: ProgressWsdto) => void;
      clearProgress: () => void;
      performance: PhysicsPerformanceDto | null;
      setPerformance: (performance: PhysicsPerformanceDto | null) => void;
      clearPerformance: () => void;
      notifications: Array<
        {
          id: string;
          date: Date;
        } & Omit<NotificationDataDto, "date">
      >;
      pushNotification: (
        notification: {
          date: Date;
        } & Omit<NotificationDataDto, "date">,
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
      graph: LiveCanvasDataDto;
      setGraph: (g: LiveCanvasDataDto | null) => void;
      setGraphElements: (g: LiveCanvasGraphElementsDto) => void;
      setGraphMetaData: (g: LiveCanvasMetaDataDto) => void;
      setGraphTable: (g: LiveCanvasTableDataDto) => void;
      setHistogram: (g: HistogramDto) => void;
      setNotes: (g: NoteDto[]) => void;
      setLocks: (locks: NodeLockCollectionEntryDto[]) => void;
      runScenarioModal: {
        shown: boolean;
        scenario: ScenarioDto | null;
        arguments: ScenarioArgumentDto[];
        additive: boolean;
        setArgumentValue: (identifier: string, value: string) => void;
        open: (
          scenario: ScenarioDto,
          scenarioArguments: ScenarioArgumentDto[],
          additive: boolean,
        ) => void;
        close: () => void;
        clean: () => void;
      };
      expandNodePreview: {
        shown: boolean;
        data: {
          relationships: ExpandNodePreviewEntryDto[];
          labels: ExpandNodePreviewEntryDto[];
          nodeId: string;
          selectedRelationships: Set<string>;
          selectedLabels: Set<string>;
        } | null;
        open: (
          data: {
            relationships: ExpandNodePreviewEntryDto[];
            labels: ExpandNodePreviewEntryDto[];
            nodeId: string;
          } | null,
        ) => void;
        close: () => void;
        clean: () => void;
        setSelectedRelationships: (
          element: ExpandNodePreviewEntryDto,
          selected: boolean,
        ) => void;
        setSelectedLabel: (
          element: ExpandNodePreviewEntryDto,
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
        tab: "knowledgeCard" | "inspector";
        setTab: (newTab: "knowledgeCard" | "inspector") => void;
      };
      histogram: {
        show: () => void;
        hide: () => void;
      };
      scenarios: {
        scenarios: ScenarioCollectionDto;
        setScenarios: (scenarios: ScenarioCollectionDto) => void;
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
          showForCreate: (nodes: NodeDto[]) => void;
          showForUpdate: (note: NoteDto) => void;
          close: () => void;
          clean: () => void;
          noteId: string | null;
          nodes: NodePreviewDto[];
          content: string;
          setContent: (c: string) => void;
          color: ColorDto | null;
          setColor: (c: ColorDto | null) => void;
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
        setData: (newValue: LiveCanvasViewSettingsDto) => void;
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
