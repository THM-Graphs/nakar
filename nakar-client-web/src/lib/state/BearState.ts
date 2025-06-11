import { Graph, WSEventScenarioProgress } from "../../../src-gen";
import { InspectorElement } from "../../components/room/Panel/Inspector/InspectorElement.ts";
import { SocketState } from "../ws/SocketState.ts";

export interface BearState {
  room: {
    ui: {
      locked: boolean;
      lock: () => void;
      unlock: () => void;
      progress: WSEventScenarioProgress | null;
      setProgress: (progress: WSEventScenarioProgress) => void;
      clearProgress: () => void;
    };
    scenario: {
      graph: Graph;
      setGraph: (g: Graph) => void;
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
