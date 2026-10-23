import { CanvasDto } from "api-client";
import { NavigateFunction } from "react-router";
import { CanvasContextData } from "../../pages/Canvas.tsx";

export type CanvasTabActionParams = {
  roomContext: CanvasContextData;
  canvas: CanvasDto;
  canvasCount: number;
  busy: boolean;
  navigate: NavigateFunction;
  execute: (operation: () => Promise<void>) => Promise<void>;
  refresh: () => Promise<void>;
  isCurrent: () => boolean;
};
