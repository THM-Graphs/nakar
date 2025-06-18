import {
  Databases,
  Graph,
  GraphElements,
  GraphMetaData,
  GraphTable,
  PhysicsPerformance,
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
    };
    scenario: {
      graph: Graph;
      setGraph: (g: Graph) => void;
      setGraphElements: (g: GraphElements) => void;
      setGraphMetaData: (g: GraphMetaData) => void;
      setGraphTable: (g: GraphTable) => void;
      setLocks: (locks: { id: string; locked: boolean }[]) => void;
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
