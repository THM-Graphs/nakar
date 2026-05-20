import { CanvasContextData } from "../../pages/Canvas.tsx";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";

export type FlipCanvasActionParams = {
  nodeCount: number;
  roomContext: CanvasContextData;
  selectedTab: SelectedCanvasTab;
};
