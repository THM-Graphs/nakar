import {
  Databases,
  ExpandNodePreviewElement,
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
import { InspectorElement } from "../../components/room/Panel/Inspector/InspectorElement.ts";
import { SocketState } from "../ws/SocketState.ts";

export interface BearState {
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
        open: (data: {
          relationships: ExpandNodePreviewElement[];
          labels: ExpandNodePreviewElement[];
          nodeId: string;
        }) => void;
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
      inspector: {
        shown: boolean;
        show: () => void;
        hide: () => void;
        element: InspectorElement | null;
        setElement: (i: InspectorElement) => void;
        removeElement: () => void;
      };
      histogram: {
        shown: boolean;
        show: () => void;
        hide: () => void;
      };
      scenarios: {
        scenarios: Databases;
        setScenarios: (scenarios: Databases) => void;
        shown: boolean;
        show: () => void;
        hide: () => void;
      };
    };
    canvas: {
      tabs: {
        selected: "graph" | "data";
        selectGraph: () => void;
        selectData: () => void;
      };
    };
  };
}
